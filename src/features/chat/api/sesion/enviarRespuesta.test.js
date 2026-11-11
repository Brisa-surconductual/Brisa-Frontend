import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { enviarRespuesta } from './enviarRespuesta.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { post: vi.fn() },
}));

const ID = '26000000-0000-4000-8000-000000000001';

const respuesta = {
  idRespuesta: '26000000-0000-4000-8000-0000000000aa',
  idNodo: 'n1',
  tipoEntrada: 'ESCALA',
  valor: 7,
  capturadaEn: '2026-11-08T14:30:00-05:00',
};

beforeEach(() => vi.resetAllMocks());

describe('enviarRespuesta (RF-27)', () => {
  it('envía el cuerpo completo y solo ese (CA-27-4, CA-27-10)', async () => {
    const data = { idRespuesta: respuesta.idRespuesta, resultado: 'VALIDA' };
    apiClient.post.mockResolvedValue({ status: 200, data });

    await expect(
      enviarRespuesta(ID, { ...respuesta, id_usuario: 'u1' }),
    ).resolves.toBe(data);

    const [url, cuerpo] = apiClient.post.mock.calls[0];
    expect(url).toMatch(new RegExp(`/chat/sesiones/${ID}/respuestas$`));
    expect(cuerpo).toEqual({ ...respuesta, conectividad: 'EN_LINEA' });
  });

  it('lanza el error del backend normalizado', async () => {
    apiClient.post.mockRejectedValue({
      response: {
        status: 500,
        data: {
          statusCode: 500,
          codigo: 'SIN_TRANSICION',
          mensaje: 'No se pudo determinar la siguiente acción.',
        },
      },
    });

    await expect(enviarRespuesta(ID, respuesta)).rejects.toMatchObject({
      status: 500,
      codigo: 'SIN_TRANSICION',
      mensaje: 'No se pudo determinar la siguiente acción.',
      reintentable: true,
    });
  });

  it('sin respuesta del servidor es SIN_CONEXION', async () => {
    apiClient.post.mockRejectedValue(new Error('Network Error'));

    await expect(enviarRespuesta(ID, respuesta)).rejects.toMatchObject({
      status: null,
      codigo: 'SIN_CONEXION',
      reintentable: true,
    });
  });
});
