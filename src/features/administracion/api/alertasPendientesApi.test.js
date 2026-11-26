import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { attendAlert, fetchPendingAlerts } from './alertasPendientesApi.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const COHORT = 'c0000000-0000-4000-8000-000000000001';
const ALERT = 'a0000000-0000-4000-8000-000000000001';

beforeEach(() => vi.resetAllMocks());

describe('fetchPendingAlerts (RF-146)', () => {
  it('GET con offset y limit, sin tipo cuando es «Todas», y devuelve el cuerpo tal cual', async () => {
    const body = { items: [], total: 0, offset: 0, limit: 20 };
    const controller = new AbortController();
    apiClient.get.mockResolvedValue({ status: 200, data: body });

    await expect(
      fetchPendingAlerts(COHORT, { type: null, offset: 0, limit: 20 }, { signal: controller.signal }),
    ).resolves.toBe(body);

    expect(apiClient.get).toHaveBeenCalledWith(`/admin/cohortes/${COHORT}/alertas/pendientes`, {
      params: { offset: 0, limit: 20 },
      signal: controller.signal,
    });
  });

  it('el filtro por tipo viaja como tipo_alerta', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: {} });

    await fetchPendingAlerts(COHORT, { type: 'INACTIVIDAD', offset: 40, limit: 20 });

    expect(apiClient.get.mock.calls[0][1].params).toEqual({ tipo_alerta: 'INACTIVIDAD', offset: 40, limit: 20 });
  });

  it('204 sin cuerpo: null (no hay alertas pendientes)', async () => {
    apiClient.get.mockResolvedValue({ status: 204, data: '' });

    await expect(fetchPendingAlerts(COHORT, { offset: 0, limit: 20 })).resolves.toBeNull();
  });

  it('errores normalizados por estado y código', async () => {
    apiClient.get.mockRejectedValue({
      response: { status: 503, data: { status: 503, codigo: 'M05_NO_DISPONIBLE', mensaje: 'No disponible.' } },
    });

    await expect(fetchPendingAlerts(COHORT, { offset: 0, limit: 20 })).rejects.toMatchObject({
      status: 503,
      codigo: 'M05_NO_DISPONIBLE',
      mensaje: 'No disponible.',
      reintentable: true,
    });
  });
});

describe('attendAlert (RF-147)', () => {
  it('POST a la alerta con exactamente { accion, motivo }', async () => {
    const data = { id_alerta: ALERT, estado: 'ATENDIDA', fecha_atencion: '2026-11-23T03:20:00.000Z' };
    apiClient.post.mockResolvedValue({ status: 200, data });

    await expect(attendAlert(ALERT, 'Se contactó al participante.')).resolves.toBe(data);

    const [url, body] = apiClient.post.mock.calls[0];
    expect(url).toBe(`/admin/alertas/${ALERT}/atender`);
    expect(body).toEqual({ accion: 'MARCAR_ATENDIDA', motivo: 'Se contactó al participante.' });
    expect(Object.keys(body)).toEqual(['accion', 'motivo']);
  });

  it('el id se codifica en la URL', async () => {
    apiClient.post.mockResolvedValue({ status: 200, data: {} });

    await attendAlert('a/b', 'Motivo suficiente.');

    expect(apiClient.post.mock.calls[0][0]).toBe('/admin/alertas/a%2Fb/atender');
  });

  it.each([
    [409, 'ALERTA_YA_ATENDIDA'],
    [404, 'ALERTA_NO_ENCONTRADA'],
    [422, 'MOTIVO_INVALIDO'],
    [500, 'ERROR_TRANSACCION'],
  ])('%s %s se propaga normalizado', async (status, codigo) => {
    apiClient.post.mockRejectedValue({ response: { status, data: { status, codigo, mensaje: 'm' } } });

    await expect(attendAlert(ALERT, 'Motivo suficiente.')).rejects.toMatchObject({ status, codigo });
  });

  it('sin respuesta es SIN_CONEXION', async () => {
    apiClient.post.mockRejectedValue(new Error('Network Error'));

    await expect(attendAlert(ALERT, 'Motivo suficiente.')).rejects.toMatchObject({
      status: null,
      codigo: 'SIN_CONEXION',
    });
  });
});
