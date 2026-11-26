import { describe, expect, it } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import {
  PROFILE_STATUS as P,
  TRACKING_CLIENT_ERROR,
  TRACKING_PROBLEM as T,
  classifyProfileError,
  classifyTrackingError,
  trackingError,
} from './trackingErrors.js';

const http = (status, codigo) => toApiError({ response: { status, data: { status, codigo, mensaje: 'Mensaje.' } } });

describe('classifyTrackingError (RF-142)', () => {
  it.each([
    [http(400, 'PARAMETRO_INVALIDO'), T.INVALID_QUERY],
    [http(401, 'NO_AUTENTICADO'), T.SESSION_REQUIRED],
    [http(403, 'ACCESO_DENEGADO'), T.DENIED],
    [http(404, 'COHORTE_NO_ENCONTRADA'), T.NOT_FOUND],
    [http(500, 'ERROR_LISTADO_INDICADORES'), T.ERROR],
    [http(503, 'M05_NO_DISPONIBLE'), T.UNAVAILABLE],
    [toApiError(new Error('Network Error')), T.ERROR],
    [new Error('sin forma'), T.ERROR],
  ])('%o → %s', (error, problem) => {
    expect(classifyTrackingError(error)).toBe(problem);
  });
});

describe('classifyProfileError (RF-128)', () => {
  it.each([
    [trackingError(null, TRACKING_CLIENT_ERROR.INVALID_CODE), P.INVALID_CODE],
    [trackingError(null, TRACKING_CLIENT_ERROR.OUTSIDE_COHORT), P.OUTSIDE_COHORT],
    [http(400, 'VALIDACION'), P.INVALID_CODE],
    [http(401, 'NO_AUTENTICADO'), P.SESSION_REQUIRED],
    [http(403, 'SIN_PERMISO_INDIVIDUAL'), P.DENIED],
    [http(404, 'PARTICIPANTE_NO_ENCONTRADO'), P.NOT_FOUND],
    [http(404, 'COHORTE_NO_ENCONTRADA'), P.COHORT_NOT_FOUND],
    [http(409, 'INCONSISTENCIA_PARTICIPANTE'), P.INCONSISTENT],
    [http(500, 'ERROR_CONSULTA_SEGUIMIENTO'), P.ERROR],
    [http(503, 'M05_NO_DISPONIBLE'), P.UNAVAILABLE],
    [toApiError(new Error('Network Error')), P.ERROR],
  ])('%o → %s', (error, status) => {
    expect(classifyProfileError(error)).toBe(status);
  });
});
