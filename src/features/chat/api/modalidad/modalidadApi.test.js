import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { habilitarModalidadPersonalizada } from './habilitarModalidadPersonalizada.js';
import { obtenerElegibilidadModalidad } from './obtenerElegibilidadModalidad.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const elegibilidad = {
  modalidad_actual: 'GRUPAL',
  total_usuarios_activos: 10,
  con_perfil_completo: 10,
  sin_perfil_completo: 0,
  elegible: true,
};

beforeEach(() => vi.resetAllMocks());

describe('obtenerElegibilidadModalidad (RF-25B)', () => {
  it('consulta la elegibilidad (respuesta sin `data`)', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: elegibilidad });

    await expect(obtenerElegibilidadModalidad()).resolves.toEqual(elegibilidad);
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/modalidad\/elegibilidad$/),
    );
  });

  it('rechaza una respuesta incompleta', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: {} });

    await expect(obtenerElegibilidadModalidad()).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });

  it('lanza el error tipado del backend', async () => {
    apiClient.get.mockRejectedValue({
      response: {
        status: 403,
        data: { message: 'No autorizado.' },
      },
    });

    await expect(obtenerElegibilidadModalidad()).rejects.toMatchObject({
      status: 403,
      backendMessage: 'No autorizado.',
    });
  });
});

describe('habilitarModalidadPersonalizada (RF-25B)', () => {
  it('envía la confirmación explícita', async () => {
    const respuesta = {
      modalidad: 'PERSONALIZADA',
      usuarios_actualizados: 10,
    };
    apiClient.post.mockResolvedValue({ status: 200, data: respuesta });

    await expect(habilitarModalidadPersonalizada()).resolves.toEqual(respuesta);
    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/chat\/admin\/modalidad\/habilitar-personalizada$/,
      ),
      { confirmacion_transicion: true },
    );
  });

  it('propaga el rechazo por perfiles incompletos con su código y mensaje', async () => {
    apiClient.post.mockRejectedValue({
      response: {
        status: 409,
        data: {
          codigo: 'PERFILES_INCOMPLETOS',
          message: 'Existen participantes activos sin perfil clínico completo.',
        },
      },
    });

    await expect(habilitarModalidadPersonalizada()).rejects.toMatchObject({
      code: 'PERFILES_INCOMPLETOS',
      status: 409,
      backendMessage:
        'Existen participantes activos sin perfil clínico completo.',
    });
  });

  it('rechaza una respuesta sin modalidad', async () => {
    apiClient.post.mockResolvedValue({ status: 200, data: {} });

    await expect(habilitarModalidadPersonalizada()).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });
});
