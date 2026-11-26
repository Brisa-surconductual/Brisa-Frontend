import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '../../../shared/utils/apiClient.jsx';
import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { cerrarSesion } from './logout.jsx';

vi.mock('../../../shared/utils/apiClient.jsx', () => ({
  apiClient: { post: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('localStorage', { removeItem: vi.fn() });
});

afterEach(() => vi.unstubAllGlobals());

describe('cierre de sesión remoto', () => {
  it('envía un cuerpo JSON válido: `null` se serializa como "null" y el backend responde 400', async () => {
    apiClient.post.mockResolvedValue({ data: {} });
    const controller = new AbortController();

    await cerrarSesion({ signal: controller.signal });

    expect(apiClient.post).toHaveBeenCalledWith(
      `${USUARIOS}/cerrar-sesion`,
      {},
      { signal: controller.signal },
    );
  });
});
