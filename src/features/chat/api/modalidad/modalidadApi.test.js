import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { habilitarModalidadPersonalizada } from './habilitarModalidadPersonalizada.js';
import { obtenerElegibilidadModalidad } from './obtenerElegibilidadModalidad.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const elegibilidad = {
  id_programa: 1,
  modalidad_actual: 'GRUPAL',
  total_usuarios_activos: 10,
  con_perfil_completo: 10,
  sin_perfil_completo: 0,
  elegible: true,
};

beforeEach(() => vi.resetAllMocks());

describe('obtenerElegibilidadModalidad (RF-25B)', () => {
  it('consulta la elegibilidad del programa (respuesta sin `data`)', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: elegibilidad });

    await expect(obtenerElegibilidadModalidad(1)).resolves.toEqual(
      elegibilidad,
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/modalidad\/elegibilidad$/),
      { params: { id_programa: 1 } },
    );
  });

  it('rechaza una respuesta incompleta', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: { id_programa: 1 } });

    await expect(obtenerElegibilidadModalidad(1)).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });

  it('lanza el error tipado del backend', async () => {
    apiClient.get.mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'El identificador del programa es invalido.' },
      },
    });

    await expect(obtenerElegibilidadModalidad(0)).rejects.toMatchObject({
      status: 400,
      backendMessage: 'El identificador del programa es invalido.',
    });
  });
});

describe('habilitarModalidadPersonalizada (RF-25B)', () => {
  it('envía el programa y la confirmación explícita', async () => {
    const respuesta = {
      id_programa: 1,
      modalidad: 'PERSONALIZADA',
      usuarios_actualizados: 10,
    };
    apiClient.post.mockResolvedValue({ status: 200, data: respuesta });

    await expect(habilitarModalidadPersonalizada(1)).resolves.toEqual(
      respuesta,
    );
    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/chat\/admin\/modalidad\/habilitar-personalizada$/,
      ),
      { id_programa: 1, confirmacion_transicion: true },
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

    await expect(habilitarModalidadPersonalizada(1)).rejects.toMatchObject({
      code: 'PERFILES_INCOMPLETOS',
      status: 409,
      backendMessage:
        'Existen participantes activos sin perfil clínico completo.',
    });
  });

  it('rechaza una respuesta sin modalidad', async () => {
    apiClient.post.mockResolvedValue({ status: 200, data: {} });

    await expect(habilitarModalidadPersonalizada(1)).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });
});
