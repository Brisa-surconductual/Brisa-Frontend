import { PARTICIPANT_EXPORT_COLUMNS } from '../types/participantExport.js';

/*
 * Interpretación de la respuesta 200 de la exportación individual
 * (RF-145). Solo se acepta un archivo que cumpla el contrato completo:
 * nombre del backend en Content-Disposition, tipo text/csv, UTF-8 con BOM
 * y un CSV RFC 4180 con las nueve columnas en su orden. El Blob recibido
 * se entrega sin modificar: no se reescribe ni se vuelve a codificar.
 */
export class InvalidParticipantExportResponse extends Error {
  constructor(reason = 'La respuesta no contiene el archivo CSV esperado.') {
    super(reason);
    this.name = 'InvalidParticipantExportResponse';
  }
}

const FILE_NAME = /^attachment;\s*filename="(seguimiento_individual_\d{8}\.csv)"$/iu;
const BOM = [0xef, 0xbb, 0xbf];
const NON_NEGATIVE_INTEGER = /^\d+$/u;

const COLUMN = Object.freeze(
  Object.fromEntries(PARTICIPANT_EXPORT_COLUMNS.map((name, index) => [name, index])),
);

function invalid(reason) {
  return new InvalidParticipantExportResponse(reason);
}

// Nombre del archivo, o null si el encabezado falta o no es el del contrato.
export function readExportFileName(headers) {
  const value = typeof headers?.get === 'function'
    ? headers.get('content-disposition')
    : headers?.['content-disposition'];

  return typeof value === 'string' ? (value.trim().match(FILE_NAME)?.[1] ?? null) : null;
}

/*
 * CSV RFC 4180: registros separados por CRLF, campos por coma; un campo
 * citado admite comas, saltos de línea y comillas duplicadas. Un campo
 * sin citar no puede contener comillas. El CRLF final es opcional.
 * Devuelve las filas como listas de celdas o lanza un error.
 */
export function parseCsv(text) {
  if (typeof text !== 'string' || text === '') throw invalid('CSV vacío.');

  const rows = [];
  let row = [];
  let index = 0;

  for (;;) {
    let cell;

    if (text[index] === '"') {
      let value = '';
      index += 1;
      for (;;) {
        const quote = text.indexOf('"', index);
        if (quote === -1) throw invalid('Campo citado sin cierre.');
        value += text.slice(index, quote);
        if (text[quote + 1] === '"') {
          value += '"';
          index = quote + 2;
          continue;
        }
        index = quote + 1;
        break;
      }
      cell = value;
    } else {
      let end = index;
      while (end < text.length && text[end] !== ',' && text[end] !== '\r' && text[end] !== '\n') {
        if (text[end] === '"') throw invalid('Comillas en un campo sin citar.');
        end += 1;
      }
      cell = text.slice(index, end);
      index = end;
    }

    row.push(cell);

    if (text[index] === ',') {
      index += 1;
      continue;
    }

    if (index === text.length) {
      rows.push(row);
      return rows;
    }

    if (text.startsWith('\r\n', index)) {
      rows.push(row);
      row = [];
      index += 2;
      if (index === text.length) return rows;
      continue;
    }

    throw invalid('Separador de registros inválido.');
  }
}

function checkRows(rows) {
  const [header, ...data] = rows;

  if (
    header.length !== PARTICIPANT_EXPORT_COLUMNS.length ||
    header.some((name, index) => name !== PARTICIPANT_EXPORT_COLUMNS[index])
  ) {
    throw invalid('Encabezado CSV inválido.');
  }

  // El backend responde 422 sin unidades: un 200 sin filas no es del contrato.
  if (data.length === 0) throw invalid('El CSV no contiene unidades.');

  for (const cells of data) {
    if (cells.length !== PARTICIPANT_EXPORT_COLUMNS.length) throw invalid('Fila CSV incompleta.');

    const counts = ['orden_unidad_temporal', 'alertas_generadas', 'alertas_atendidas'].map(
      (name) => cells[COLUMN[name]],
    );
    if (!counts.every((value) => NON_NEGATIVE_INTEGER.test(value))) throw invalid('Valores numéricos inválidos.');

    const [, generated, attended] = counts.map(Number);
    if (attended > generated) throw invalid('Alertas atendidas mayores que las generadas.');
  }

  return data.length;
}

async function readBytes(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

/*
 * `response`: respuesta de axios con `responseType: 'blob'`. Devuelve
 * { fileName, blob, sizeBytes, unitCount } con el Blob original, o lanza
 * InvalidParticipantExportResponse. Nunca inventa un nombre de archivo.
 */
export async function readParticipantExportResponse(response) {
  const fileName = readExportFileName(response?.headers);
  if (!fileName) throw invalid('Falta el nombre del archivo en la respuesta.');

  const data = response?.data;
  if (
    !(data instanceof Blob) ||
    data.size <= BOM.length ||
    data.type.split(';')[0].trim().toLowerCase() !== 'text/csv'
  ) {
    throw invalid('La respuesta no es un archivo CSV.');
  }

  const bytes = await readBytes(data);
  if (!BOM.every((byte, index) => bytes[index] === byte)) throw invalid('El CSV no es UTF-8 con BOM.');

  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(BOM.length));
  } catch {
    throw invalid('El CSV no es UTF-8 válido.');
  }

  const unitCount = checkRows(parseCsv(text));

  return { fileName, blob: data, sizeBytes: data.size, unitCount };
}
