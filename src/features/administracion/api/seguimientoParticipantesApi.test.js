import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { fetchCohortParticipantIndicators, fetchParticipantTrackingProfile } from './seguimientoParticipantesApi.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn() },
}));

const COHORT = 'c0000000-0000-4000-8000-000000000001';
const CODE = 'P-7F3A91C2';

const httpError = (status, codigo) => ({ response: { status, headers: {}, data: { status, codigo, mensaje: 'Mensaje del servidor.' } } });

beforeEach(() => vi.resetAllMocks());

describe('fetchCohortParticipantIndicators (RF-142)', () => {
  it('GET por apiClient con los parámetros reales y el cuerpo tal cual', async () => {
    const body = { items: [], total: 0, offset: 0, limit: 20 };
    const controller = new AbortController();
    const params = { nivel_progreso: 'EN_AVANCE', con_alertas: 'true', offset: 0, limit: 20 };
    apiClient.get.mockResolvedValue({ status: 200, data: body });

    await expect(fetchCohortParticipantIndicators(COHORT, params, { signal: controller.signal })).resolves.toBe(body);
    expect(apiClient.get).toHaveBeenCalledWith(`/admin/cohortes/${COHORT}/participantes/indicadores`, {
      params,
      signal: controller.signal,
    });
  });

  it.each([400, 401, 403, 404, 500, 503])('%i: error normalizado { status, codigo, mensaje }', async (status) => {
    apiClient.get.mockRejectedValue(httpError(status, 'CODIGO'));

    await expect(fetchCohortParticipantIndicators(COHORT, {})).rejects.toMatchObject({ status, codigo: 'CODIGO' });
  });

  it('sin respuesta: SIN_CONEXION', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'));

    await expect(fetchCohortParticipantIndicators(COHORT, {})).rejects.toMatchObject({ status: null, codigo: 'SIN_CONEXION' });
  });
});

describe('fetchParticipantTrackingProfile (RF-128)', () => {
  it('GET por apiClient con el seudónimo y el cuerpo tal cual', async () => {
    const body = { codigo_participante: CODE };
    apiClient.get.mockResolvedValue({ status: 200, data: body });

    await expect(fetchParticipantTrackingProfile(CODE)).resolves.toBe(body);
    expect(apiClient.get).toHaveBeenCalledWith(`/admin/participantes/${CODE}/perfil-seguimiento`, { signal: undefined });
  });

  it('204: sin perfil (null)', async () => {
    apiClient.get.mockResolvedValue({ status: 204, data: '' });

    await expect(fetchParticipantTrackingProfile(CODE)).resolves.toBeNull();
  });

  it('codifica el segmento de la ruta', async () => {
    apiClient.get.mockResolvedValue({ status: 204, data: '' });

    await fetchParticipantTrackingProfile('P-1/../x');

    expect(apiClient.get.mock.calls[0][0]).toBe('/admin/participantes/P-1%2F..%2Fx/perfil-seguimiento');
  });

  it.each([
    [403, 'SIN_PERMISO_INDIVIDUAL'],
    [404, 'PARTICIPANTE_NO_ENCONTRADO'],
    [409, 'INCONSISTENCIA_PARTICIPANTE'],
    [503, 'M05_NO_DISPONIBLE'],
    [500, 'ERROR_CONSULTA_SEGUIMIENTO'],
  ])('%i %s: error normalizado', async (status, codigo) => {
    apiClient.get.mockRejectedValue(httpError(status, codigo));

    await expect(fetchParticipantTrackingProfile(CODE)).rejects.toMatchObject({ status, codigo });
  });
});
