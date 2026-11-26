import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { enviarRespuesta } from './enviarRespuesta.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { post: vi.fn() },
}));

const ID = '26000000-0000-4000-8000-000000000001';

const respuesta = {
  id_interaccion: '26000000-0000-4000-8000-0000000000aa',
  id_nodo: 'n1',
  secuencia: 3,
  tipo_entrada: 'ESCALA',
  valor: 7,
  timestamp_interaccion: '2026-11-08T14:30:00-05:00',
  estado_conectividad: 'EN_LINEA',
  recursos_no_presentados: null,
};

beforeEach(() => vi.resetAllMocks());

describe('enviarRespuesta (RF-27 a RF-30)', () => {
  it('envía el cuerpo RF-30 y solo ese, y devuelve el contenido de data (CA-30-1)', async () => {
    const data = { id_interaccion: respuesta.id_interaccion, secuencia: 3 };
    apiClient.post.mockResolvedValue({ status: 201, data: { data } });

    await expect(
      enviarRespuesta(ID, { ...respuesta, id_usuario: 'u1' }),
    ).resolves.toBe(data);

    const [url, cuerpo] = apiClient.post.mock.calls[0];
    expect(url).toMatch(new RegExp(`/chat/sesiones/${ID}/respuestas$`));
    expect(cuerpo).toEqual(respuesta);
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
