import { EXPORT_COLUMNS, EXPORT_VIEW_STATE } from '../types/cohortExport.js';

const NAME =
  /^attachment;\s*filename="(indicadores_cohorte_activa_\d{8}\.csv)"$/iu;
const HEADER = EXPORT_COLUMNS.join(',') + '\r\n';
const BEHAVIORAL_STATE = EXPORT_COLUMNS.indexOf('estado_vista_conductual');
const NOTIFICATION_STATE = EXPORT_COLUMNS.indexOf(
  'estado_vista_notificaciones',
);

function findQuotedEnd(csv, start) {
  let end = csv.indexOf('"', start + 1);
  while (end !== -1 && csv[end + 1] === '"') {
    end = csv.indexOf('"', end + 2);
  }
  if (end === -1) throw new Error('Campo citado sin cierre.');
  return end;
}

function readViewStates(csv) {
  if (!csv.startsWith(HEADER)) throw new Error('Encabezado CSV inválido.');

  // Una fila RFC 4180. El nombre de cohorte puede contener comas, comillas y saltos.
  const delimiters = /[",\r\n]/gu;
  let start = HEADER.length;
  const cells = EXPORT_COLUMNS.map((_, index) => {
    const quoted = csv[start] === '"';
    delimiters.lastIndex = start;
    const end = quoted
      ? findQuotedEnd(csv, start)
      : delimiters.exec(csv)?.index;
    if (end === undefined) throw new Error('Fila CSV incompleta.');
    const separator = index === EXPORT_COLUMNS.length - 1 ? '\r\n' : ',';
    const separatorIndex = end + Number(quoted);
    if (!csv.startsWith(separator, separatorIndex))
      throw new Error('Fila CSV inválida.');
    const value = csv.slice(start + Number(quoted), end);
    start = separatorIndex + separator.length;
    return value;
  });
  if (start !== csv.length) throw new Error('Filas CSV inesperadas.');

  const behavioral = cells[BEHAVIORAL_STATE];
  const notifications = cells[NOTIFICATION_STATE];
  if (
    ![EXPORT_VIEW_STATE.AVAILABLE, EXPORT_VIEW_STATE.STALE].includes(
      behavioral,
    ) ||
    !Object.values(EXPORT_VIEW_STATE).includes(notifications)
  ) {
    throw new Error('Estados de las vistas inválidos.');
  }

  return {
    notificationsAvailable: notifications !== EXPORT_VIEW_STATE.NOT_AVAILABLE,
    behavioralStale: behavioral === EXPORT_VIEW_STATE.STALE,
  };
}

export async function readCohortExportResponse({ data, headers }) {
  const disposition = headers?.['content-disposition'];
  const fileName =
    typeof disposition === 'string' ? disposition.match(NAME)?.[1] : undefined;
  if (
    !fileName ||
    !(data instanceof Blob) ||
    data.size === 0 ||
    data.type.split(';')[0] !== 'text/csv'
  ) {
    throw new Error('La respuesta no contiene el archivo CSV esperado.');
  }

  const states = readViewStates(await data.text());
  return { fileName, blob: data, sizeBytes: data.size, ...states };
}
