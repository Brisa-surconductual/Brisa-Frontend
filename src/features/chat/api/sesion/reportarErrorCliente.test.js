import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { reportarErrorCliente } from './reportarErrorCliente.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { post: vi.fn() },
}));

const ID = '37000000-0000-4000-8000-000000000001';

beforeEach(() => vi.resetAllMocks());

describe('reportarErrorCliente (RF-37)', () => {
  it('envía solo codigo e id_sesion con su X-Request-Id', async () => {
    apiClient.post.mockResolvedValue({ status: 204 });

    await reportarErrorCliente({ codigo: 'ERROR_PRESENTACION', idSesion: ID });

    const [url, cuerpo, config] = apiClient.post.mock.calls[0];
    expect(url).toMatch(/\/chat\/errores-cliente$/);
    expect(cuerpo).toEqual({ codigo: 'ERROR_PRESENTACION', id_sesion: ID });
    expect(config.headers['X-Request-Id']).toEqual(expect.any(String));
  });

  it('sin sesión no envía id_sesion', async () => {
    apiClient.post.mockResolvedValue({ status: 204 });

    await reportarErrorCliente({ codigo: 'SIN_CONEXION' });

    expect(apiClient.post.mock.calls[0][1]).toEqual({ codigo: 'SIN_CONEXION' });
  });

  it('lanza el error normalizado (p. ej. 429 LIMITE_REPORTES)', async () => {
    apiClient.post.mockRejectedValue({
      response: {
        status: 429,
        headers: { 'x-request-id': 'req-1' },
        data: {
          statusCode: 429,
          codigo: 'LIMITE_REPORTES',
          mensaje: 'Has enviado varios reportes en poco tiempo.',
        },
      },
    });

    await expect(
      reportarErrorCliente({ codigo: 'SIN_CONEXION' }),
    ).rejects.toMatchObject({
      status: 429,
      codigo: 'LIMITE_REPORTES',
      reintentable: false,
      requestId: 'req-1',
    });
  });
});
