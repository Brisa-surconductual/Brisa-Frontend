import { describe, expect, it } from 'vitest';

import { PARTICIPANT_EXPORT_COLUMNS } from '../types/participantExport.js';

import {
  InvalidParticipantExportResponse,
  parseCsv,
  readExportFileName,
  readParticipantExportResponse,
} from './participantExportResponse.js';

const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
const HEADER = PARTICIPANT_EXPORT_COLUMNS.join(',');
const ROW_1 = '1,"Unidad 1, inicio",2026-01-05,2026-01-11,INICIAL,0.75,3.5,2,1';
const ROW_2 = '2,"Dijo ""basta""\r\ny siguió",2026-01-12,2026-01-18,No disponible,No disponible,No disponible,0,0';
const CSV = `${HEADER}\r\n${ROW_1}\r\n${ROW_2}\r\n`;
const DISPOSITION = 'attachment; filename="seguimiento_individual_20261126.csv"';

const csvBlob = (text = CSV, { bom = true, type = 'text/csv; charset=utf-8' } = {}) =>
  new Blob(bom ? [BOM, text] : [text], { type });

const response = (changes = {}) => ({
  status: 200,
  data: csvBlob(),
  headers: { 'content-disposition': DISPOSITION, 'content-type': 'text/csv; charset=utf-8' },
  ...changes,
});

const rejectsInvalid = (promise) => expect(promise).rejects.toBeInstanceOf(InvalidParticipantExportResponse);

describe('parseCsv (RFC 4180)', () => {
  it('lee las nueve columnas exactas y en su orden', () => {
    const [header] = parseCsv(CSV);

    expect(header).toEqual([
      'orden_unidad_temporal',
      'nombre_unidad',
      'fecha_inicio_unidad',
      'fecha_fin_unidad',
      'nivel_progreso',
      'tasa_adherencia',
      'craving_promedio',
      'alertas_generadas',
      'alertas_atendidas',
    ]);
  });

  it('valores citados con comas, comillas duplicadas y saltos de línea', () => {
    const [, first, second] = parseCsv(CSV);

    expect(first[1]).toBe('Unidad 1, inicio');
    expect(second[1]).toBe('Dijo "basta"\r\ny siguió');
    expect(first).toHaveLength(9);
    expect(second).toHaveLength(9);
  });

  it('campos vacíos y CRLF final opcional', () => {
    expect(parseCsv('a,,c\r\n"",x,')).toEqual([['a', '', 'c'], ['', 'x', '']]);
  });

  it.each([
    ['comilla sin cierre', 'a,"b\r\n'],
    ['comillas en campo sin citar', 'a,b"c\r\n'],
    ['texto tras el cierre de comillas', 'a,"b"c\r\n'],
    ['salto de línea sin CR', 'a,b\nc,d\n'],
    ['CR aislado', 'a,b\rc'],
    ['vacío', ''],
  ])('rechaza %s', (_, text) => {
    expect(() => parseCsv(text)).toThrow(InvalidParticipantExportResponse);
  });
});

describe('readExportFileName', () => {
  it('nombre del backend, también con encabezados tipo AxiosHeaders', () => {
    expect(readExportFileName({ 'content-disposition': DISPOSITION })).toBe('seguimiento_individual_20261126.csv');
    expect(readExportFileName({ get: (name) => (name === 'content-disposition' ? DISPOSITION : null) }))
      .toBe('seguimiento_individual_20261126.csv');
  });

  it.each([
    ['ausente (por ejemplo, no expuesto por CORS)', {}],
    ['otro nombre', { 'content-disposition': 'attachment; filename="indicadores_cohorte_activa_20261126.csv"' }],
    ['ruta', { 'content-disposition': 'attachment; filename="../seguimiento_individual_20261126.csv"' }],
    ['fecha incompleta', { 'content-disposition': 'attachment; filename="seguimiento_individual_2026112.csv"' }],
    ['inline', { 'content-disposition': 'inline; filename="seguimiento_individual_20261126.csv"' }],
  ])('sin nombre válido: %s', (_, headers) => {
    expect(readExportFileName(headers)).toBeNull();
  });
});

describe('readParticipantExportResponse', () => {
  it('200 válido: nombre del encabezado y el Blob original (BOM, MIME y bytes intactos)', async () => {
    const original = response();
    const file = await readParticipantExportResponse(original);

    expect(file).toEqual({
      fileName: 'seguimiento_individual_20261126.csv',
      blob: original.data,
      sizeBytes: original.data.size,
      unitCount: 2,
    });
    expect(file.blob).toBe(original.data);
    expect(file.blob.type).toBe('text/csv; charset=utf-8');
    expect([...new Uint8Array(await file.blob.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it('no modifica el contenido del Blob al leerlo', async () => {
    const original = response();
    const before = new Uint8Array(await original.data.arrayBuffer());

    await readParticipantExportResponse(original);

    expect(new Uint8Array(await original.data.arrayBuffer())).toEqual(before);
  });

  it('ausencia de Content-Disposition: sin nombre inventado', async () => {
    await rejectsInvalid(readParticipantExportResponse(response({ headers: {} })));
  });

  it.each([
    ['sin BOM', () => csvBlob(CSV, { bom: false })],
    ['tipo JSON', () => csvBlob(CSV, { type: 'application/json' })],
    ['vacío', () => new Blob([], { type: 'text/csv' })],
    ['no es Blob', () => CSV],
    ['UTF-8 inválido', () => new Blob([BOM, HEADER, '\r\n', new Uint8Array([0xc3, 0x28])], { type: 'text/csv' })],
    ['columnas en otro orden', () => csvBlob(`${[...PARTICIPANT_EXPORT_COLUMNS].reverse().join(',')}\r\n${ROW_1}\r\n`)],
    ['columna adicional', () => csvBlob(`${HEADER},codigo_participante\r\n${ROW_1},P-1A2B3C4D\r\n`)],
    ['columna faltante', () => csvBlob(`${PARTICIPANT_EXPORT_COLUMNS.slice(1).join(',')}\r\n${ROW_1}\r\n`)],
    ['sin filas', () => csvBlob(`${HEADER}\r\n`)],
    ['fila incompleta', () => csvBlob(`${HEADER}\r\n1,Unidad,2026-01-05\r\n`)],
    ['conteo no numérico', () => csvBlob(`${HEADER}\r\n1,Unidad,2026-01-05,2026-01-11,INICIAL,0.7,3,dos,1\r\n`)],
    ['atendidas mayores que generadas', () => csvBlob(`${HEADER}\r\n1,Unidad,2026-01-05,2026-01-11,INICIAL,0.7,3,1,2\r\n`)],
    ['malformado', () => csvBlob(`${HEADER}\r\n1,"Unidad\r\n`)],
  ])('respuesta inválida (%s): no hay archivo', async (_, data) => {
    await rejectsInvalid(readParticipantExportResponse(response({ data: data() })));
  });
});
