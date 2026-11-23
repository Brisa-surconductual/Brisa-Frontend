import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { observeReadOnlyRejections } from './observeReadOnlyRejections.js';

const BACKEND_ERROR = {
  status: 403,
  codigo: 'ESCRITURA_NO_PERMITIDA',
  mensaje: 'Esta información es de solo lectura para el rol administrativo.',
};

const rejectWith = (error) =>
  apiClient.get('/prueba-rf148', { adapter: () => Promise.reject(error) });

describe('Integración HTTP del rechazo RF-148', () => {
  let stop;

  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: () => null });
  });

  afterEach(() => {
    stop?.();
    vi.unstubAllGlobals();
  });

  it('notifica con el mensaje del backend y propaga el error original', async () => {
    const listener = vi.fn();
    stop = observeReadOnlyRejections(listener);
    const error = {
      code: 'ERR_BAD_REQUEST',
      response: { status: 403, data: BACKEND_ERROR },
    };

    await expect(rejectWith(error)).rejects.toBe(error);
    expect(listener).toHaveBeenCalledExactlyOnceWith(BACKEND_ERROR.mensaje);
  });

  it('deja pasar consultas y otros errores con su resultado original', async () => {
    const listener = vi.fn();
    stop = observeReadOnlyRejections(listener);
    const response = { status: 200, data: { items: [] } };

    await expect(
      apiClient.get('/prueba-rf148', { adapter: async () => response }),
    ).resolves.toBe(response);

    for (const response of [
      { status: 403, data: { codigo: 'CSRF_INVALIDO' } },
      { status: 403, data: { codigo: 'ACCESO_DENEGADO' } },
      { status: 400, data: { codigo: 'PARAMETRO_INVALIDO' } },
      { status: 401, data: BACKEND_ERROR },
      undefined,
    ]) {
      const error = { response };
      await expect(rejectWith(error)).rejects.toBe(error);
    }
    expect(listener).not.toHaveBeenCalled();
  });

  it('ignora rechazos de una petición pendiente al salir de la vista', async () => {
    const listener = vi.fn();
    stop = observeReadOnlyRejections(listener);
    let reject;
    const request = apiClient.get('/prueba-rf148', {
      adapter: () => new Promise((resolve, fail) => { reject = fail; }),
    });
    await vi.waitFor(() => expect(reject).toBeTypeOf('function'));

    stop();
    const error = { response: { status: 403, data: BACKEND_ERROR } };
    const result = expect(request).rejects.toBe(error);
    reject(error);
    await result;
    await expect(rejectWith(error)).rejects.toBe(error);
    expect(listener).not.toHaveBeenCalled();
  });
});
