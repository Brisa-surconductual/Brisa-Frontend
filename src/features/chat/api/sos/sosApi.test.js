import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { activarSos } from './activarSos.js';
import { finalizarSos } from './finalizarSos.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { post: vi.fn() },
}));

const ID = 'a0000000-0000-4000-8000-000000000001';

beforeEach(() => vi.resetAllMocks());

describe('activarSos (RF-43)', () => {
  it('envía solo contexto_origen (módulo, ruta, estado) y devuelve data', async () => {
    const data = { id_intervencion: ID };
    apiClient.post.mockResolvedValue({ status: 201, data: { data } });

    await expect(
      activarSos({
        modulo: 'CHAT',
        ruta: '/app/estudiante/chat',
        estado: null,
        extra: 'x',
      }),
    ).resolves.toBe(data);

    const [url, cuerpo, config] = apiClient.post.mock.calls[0];
    expect(url).toMatch(/\/chat\/sos\/activar$/);
    expect(cuerpo).toEqual({
      contexto_origen: {
        modulo: 'CHAT',
        ruta: '/app/estudiante/chat',
        estado: null,
      },
    });
    expect(config.headers['X-Request-Id']).toEqual(expect.any(String));
  });

  it('sin contexto envía {} (nunca null ni id_usuario)', async () => {
    apiClient.post.mockResolvedValue({ status: 201, data: { data: {} } });

    await activarSos();

    expect(apiClient.post.mock.calls[0][1]).toEqual({});
  });

  it.each([
    [401, undefined],
    [403, 'CSRF_INVALIDO'],
    [404, 'SIN_FLUJO_SOS'],
    [409, 'INTERVENCION_EN_CURSO'],
  ])('%s %s: error normalizado por código', async (status, codigo) => {
    apiClient.post.mockRejectedValue({
      response: { status, data: { statusCode: status, codigo, mensaje: 'm' } },
    });

    await expect(activarSos()).rejects.toMatchObject({
      status,
      codigo: codigo ?? 'DESCONOCIDO',
      reintentable: false,
    });
  });

  it('sin respuesta del servidor es SIN_CONEXION reintentable', async () => {
    apiClient.post.mockRejectedValue(new Error('Network Error'));

    await expect(activarSos()).rejects.toMatchObject({
      status: null,
      codigo: 'SIN_CONEXION',
      reintentable: true,
    });
  });
});

describe('finalizarSos (RF-43)', () => {
  it('POST con el id de la intervención y solo el motivo', async () => {
    const data = { estado: 'COMPLETA', duracion_segundos: 40 };
    apiClient.post.mockResolvedValue({ status: 200, data: { data } });

    await expect(finalizarSos(ID, 'COMPLETADA')).resolves.toBe(data);

    const [url, cuerpo] = apiClient.post.mock.calls[0];
    expect(url).toMatch(new RegExp(`/chat/sos/${ID}/finalizar$`));
    expect(cuerpo).toEqual({ motivo: 'COMPLETADA' });
  });

  it.each([
    [404, 'INTERVENCION_NO_ENCONTRADA'],
    [409, 'INTERVENCION_FINALIZADA'],
  ])('%s %s se propaga por código', async (status, codigo) => {
    apiClient.post.mockRejectedValue({
      response: { status, data: { statusCode: status, codigo, mensaje: 'm' } },
    });

    await expect(finalizarSos(ID, 'TIEMPO_AGOTADO')).rejects.toMatchObject({
      status,
      codigo,
    });
  });
});
