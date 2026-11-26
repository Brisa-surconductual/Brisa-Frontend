import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { PARTICIPANT_EXPORT_COLUMNS, PARTICIPANT_EXPORT_ERROR as E } from '../types/participantExport.js';

import { fetchParticipantExportCsv } from './participantExportApi.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn() },
}));

const CODE = 'P-1A2B3C4D';
const URL = `/admin/participantes/${CODE}/exportacion.csv`;
const CSV = `${PARTICIPANT_EXPORT_COLUMNS.join(',')}\r\n1,Unidad 1,2026-01-05,2026-01-11,INICIAL,0.75,3.5,2,1\r\n`;
const csvBlob = () => new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), CSV], { type: 'text/csv; charset=utf-8' });
const ok = (changes = {}) => ({
  status: 200,
  data: csvBlob(),
  headers: { 'content-disposition': 'attachment; filename="seguimiento_individual_20261126.csv"' },
  ...changes,
});

// Error HTTP de axios con `responseType: 'blob'`: el cuerpo JSON llega como Blob.
const httpError = (status, codigo, mensaje = 'Mensaje del servidor.') => ({
  response: {
    status,
    headers: {},
    data: new Blob([JSON.stringify({ status, codigo, mensaje })], { type: 'application/json' }),
  },
});

beforeEach(() => vi.resetAllMocks());

describe('fetchParticipantExportCsv (RF-145)', () => {
  it('una sola GET por apiClient, con el seudónimo A7 y responseType blob', async () => {
    const controller = new AbortController();
    const response = ok();
    apiClient.get.mockResolvedValue(response);

    const file = await fetchParticipantExportCsv(CODE, { signal: controller.signal });

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(URL, { responseType: 'blob', signal: controller.signal });
    expect(file).toMatchObject({ fileName: 'seguimiento_individual_20261126.csv', unitCount: 1 });
    expect(file.blob).toBe(response.data);
  });

  it('normaliza el seudónimo a mayúsculas', async () => {
    apiClient.get.mockResolvedValue(ok());

    await fetchParticipantExportCsv(' p-1a2b3c4d ');

    expect(apiClient.get.mock.calls[0][0]).toBe(URL);
  });

  it.each([
    ['referencia opaca de la ruta', 'seg-0001'],
    ['código ficticio de la demostración', 'PART-0015'],
    ['UUID', 'c0000000-0000-4000-8000-000000000001'],
    ['correo', 'persona@ejemplo.com'],
    ['formato incompleto', 'P-1A2B3C4'],
    ['vacío', ''],
    ['nulo', null],
  ])('rechaza %s sin hacer ninguna petición', async (_, code) => {
    await expect(fetchParticipantExportCsv(code)).rejects.toMatchObject({ code: E.INVALID_CODE });
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'VALIDACION', E.INVALID_CODE],
    [401, 'NO_AUTENTICADO', E.SESSION_REQUIRED],
    [403, 'SIN_PERMISO_INDIVIDUAL', E.FORBIDDEN],
    [404, 'PARTICIPANTE_NO_ENCONTRADO', E.NOT_FOUND],
    [409, 'INCONSISTENCIA_PARTICIPANTE', E.INCONSISTENT],
    [422, 'SIN_INDICADORES', E.NO_INDICATORS],
    [500, 'EXPORTACION_ABORTADA', E.ABORTED],
    [502, undefined, E.ABORTED],
    [503, 'M05_NO_DISPONIBLE', E.UNAVAILABLE],
  ])('%i %s (JSON recibido como Blob) → %s', async (status, codigo, code) => {
    apiClient.get.mockRejectedValue(httpError(status, codigo));

    await expect(fetchParticipantExportCsv(CODE)).rejects.toEqual({
      status,
      codigo: codigo ?? 'DESCONOCIDO',
      code,
    });
  });

  it('un cuerpo de error que no es JSON se clasifica por el estado', async () => {
    apiClient.get.mockRejectedValue({ response: { status: 403, data: new Blob(['<html>'], { type: 'text/html' }) } });

    await expect(fetchParticipantExportCsv(CODE)).rejects.toMatchObject({ code: E.FORBIDDEN });
  });

  it('sin respuesta (red o cancelación): error de conexión, sin archivo', async () => {
    apiClient.get.mockRejectedValue(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }));

    await expect(fetchParticipantExportCsv(CODE)).rejects.toMatchObject({ status: null, code: E.CONNECTION });
  });

  it.each([
    ['sin Content-Disposition', ok({ headers: {} })],
    ['un JSON con estado 200', ok({ data: new Blob(['{"ok":true}'], { type: 'application/json' }) })],
    ['CSV malformado', ok({ data: new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), 'a,b\r\n'], { type: 'text/csv' }) })],
  ])('200 con %s: respuesta inválida', async (_, response) => {
    apiClient.get.mockResolvedValue(response);

    await expect(fetchParticipantExportCsv(CODE)).rejects.toMatchObject({ code: E.INVALID_RESPONSE });
  });
});
