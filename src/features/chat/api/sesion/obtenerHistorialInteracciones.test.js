import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { obtenerHistorialInteracciones } from './obtenerHistorialInteracciones.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn() },
}));

const ID = '32000000-0000-4000-8000-000000000001';

beforeEach(() => vi.resetAllMocks());

describe('obtenerHistorialInteracciones (RF-31 / RF-32)', () => {
  it('pide la página más reciente sin parámetros y devuelve data', async () => {
    const data = { items: [], hay_mas: false, siguiente_cursor: null };
    apiClient.get.mockResolvedValue({ status: 200, data: { data } });

    await expect(obtenerHistorialInteracciones(ID)).resolves.toBe(data);

    const [url, config] = apiClient.get.mock.calls[0];
    expect(url).toMatch(new RegExp(`/chat/sesiones/${ID}/historial$`));
    // RF-37: cada petición lleva su X-Request-Id.
    expect(config).toEqual({
      params: undefined,
      headers: { 'X-Request-Id': expect.any(String) },
    });
  });

  it('pide la página anterior con antes_de_secuencia y limite', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: { data: {} } });

    await obtenerHistorialInteracciones(ID, {
      antesDeSecuencia: 21,
      limite: 20,
    });

    expect(apiClient.get.mock.calls[0][1]).toEqual({
      params: { antes_de_secuencia: 21, limite: 20 },
      headers: { 'X-Request-Id': expect.any(String) },
    });
  });

  it('no envía un cursor que no sea entero', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: { data: {} } });

    await obtenerHistorialInteracciones(ID, { antesDeSecuencia: null });

    expect(apiClient.get.mock.calls[0][1]).toEqual({
      params: undefined,
      headers: { 'X-Request-Id': expect.any(String) },
    });
  });

  it('lanza el error del backend normalizado por codigo', async () => {
    apiClient.get.mockRejectedValue({
      response: {
        status: 404,
        data: {
          statusCode: 404,
          codigo: 'SESION_NO_ENCONTRADA',
          mensaje: 'No se pudo recuperar el contenido del chat.',
        },
      },
    });

    await expect(obtenerHistorialInteracciones(ID)).rejects.toMatchObject({
      status: 404,
      codigo: 'SESION_NO_ENCONTRADA',
      mensaje: 'No se pudo recuperar el contenido del chat.',
    });
  });
});
