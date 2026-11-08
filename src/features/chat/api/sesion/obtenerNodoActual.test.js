import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { obtenerNodoActual } from './obtenerNodoActual.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn() },
}));

const ID = '26000000-0000-4000-8000-000000000001';

beforeEach(() => vi.resetAllMocks());

describe('obtenerNodoActual (RF-26)', () => {
  it('pide el nodo con el idSesion, sin cuerpo ni id_usuario (CA-26-1)', async () => {
    const data = { idSesion: ID, estadoSesion: 'ACTIVA', nodo: {} };
    apiClient.get.mockResolvedValue({ status: 200, data });

    await expect(obtenerNodoActual(ID)).resolves.toBe(data);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get.mock.calls[0]).toEqual([
      expect.stringMatching(new RegExp(`/chat/sesiones/${ID}/nodo-actual$`)),
    ]);
  });

  it('lanza el error del backend normalizado', async () => {
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

    await expect(obtenerNodoActual(ID)).rejects.toMatchObject({
      status: 404,
      codigo: 'SESION_NO_ENCONTRADA',
      mensaje: 'No se pudo recuperar el contenido del chat.',
      reintentable: false,
    });
  });
});
