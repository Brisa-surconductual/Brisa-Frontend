import { describe, expect, it } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import { TRACE_QUERY_STATUS as S } from '../types/chatTraceability.js';

import { classifyTraceError } from './chatTraceabilityError.js';

const http = (status, data = {}) => toApiError({ response: { status, data } });

describe('classifyTraceError (RF-38)', () => {
  it.each([
    [http(400, { codigo: 'PARAMETRO_INVALIDO', mensaje: 'x' }), S.INVALID_REQUEST, false],
    [http(401, { codigo: 'NO_AUTENTICADO' }), S.UNAUTHENTICATED, false],
    [http(403, { codigo: 'NO_AUTORIZADO' }), S.DENIED, false],
    [http(404, { codigo: 'PARTICIPANTE_NO_ENCONTRADO' }), S.PARTICIPANT_NOT_FOUND, false],
    [http(404, { codigo: 'SESION_NO_ENCONTRADA' }), S.SESSION_NOT_FOUND, false],
    [http(404, {}), S.SERVER_ERROR, false],
    [http(422, { codigo: 'HISTORIAL_INCONSISTENTE' }), S.INCONSISTENT_HISTORY, false],
    [http(422, { codigo: 'OTRO' }), S.SERVER_ERROR, false],
    [http(500, { statusCode: 500, mensaje: 'Error interno' }), S.SERVER_ERROR, true],
    [http(503, {}), S.SERVER_ERROR, true],
    [toApiError(new Error('Network Error')), S.CONNECTION_ERROR, true],
  ])('%#: decide por estado y código', (error, status, canRetry) => {
    expect(classifyTraceError(error)).toMatchObject({ status, canRetry });
  });

  it('conserva el mensaje del backend tal cual', () => {
    expect(
      classifyTraceError(http(404, { codigo: 'PARTICIPANTE_NO_ENCONTRADO', mensaje: 'No se encontró el participante solicitado.' })).message,
    ).toBe('No se encontró el participante solicitado.');
  });

  it('no decide por el texto: un 403 con un mensaje de «no encontrado» sigue siendo DENIED', () => {
    expect(classifyTraceError(http(403, { mensaje: 'No se encontró' })).status).toBe(S.DENIED);
  });
});
