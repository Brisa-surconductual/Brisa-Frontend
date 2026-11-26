import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { archivarArbolPersonalizado } from './archivarArbolPersonalizado.js';
import { crearArbolPersonalizado } from './crearArbolPersonalizado.js';
import { listarArbolesPersonalizados } from './listarArbolesPersonalizados.js';
import { crearNuevaVersionArbol } from './nuevaVersionArbolPersonalizado.js';
import { publicarArbolPersonalizado } from './publicarArbolPersonalizado.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const BASE = /\/chat\/administracion\/arboles-personalizados/;

beforeEach(() => vi.resetAllMocks());

describe('listarArbolesPersonalizados (RF-25C)', () => {
  it('devuelve las combinaciones (la respuesta no viene envuelta en data)', async () => {
    const combinaciones = [
      {
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: 'POSITIVO',
        versiones: [],
      },
    ];
    apiClient.get.mockResolvedValue({ status: 200, data: { combinaciones } });

    await expect(listarArbolesPersonalizados()).resolves.toEqual(combinaciones);
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${BASE.source}$`)),
    );
  });

  it('rechaza una respuesta sin combinaciones', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: {} });

    await expect(listarArbolesPersonalizados()).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });

  it('lanza el error tipado del backend', async () => {
    apiClient.get.mockRejectedValue({
      response: { status: 403, data: { message: 'Sin permisos.' } },
    });

    await expect(listarArbolesPersonalizados()).rejects.toMatchObject({
      status: 403,
      backendMessage: 'Sin permisos.',
    });
  });
});

describe('crearArbolPersonalizado (RF-25C)', () => {
  it('envía nombre, modalidad PERSONALIZADA y el perfil clínico', async () => {
    apiClient.post.mockResolvedValue({
      status: 201,
      data: { id_flujo: 'f-1' },
    });

    await expect(
      crearArbolPersonalizado({
        nombre: 'Personalizado · X',
        tipoDependencia: 'TOLERANCIA',
        tipoCraving: 'NEGATIVO',
      }),
    ).resolves.toEqual({ id_flujo: 'f-1' });

    expect(apiClient.post).toHaveBeenCalledWith(expect.stringMatching(BASE), {
      nombre: 'Personalizado · X',
      modalidad: 'PERSONALIZADA',
      tipo_dependencia: 'TOLERANCIA',
      tipo_craving: 'NEGATIVO',
    });
  });

  it('rechaza una respuesta sin id_flujo', async () => {
    apiClient.post.mockResolvedValue({ status: 201, data: {} });

    await expect(
      crearArbolPersonalizado({
        nombre: 'x',
        tipoDependencia: 'a',
        tipoCraving: 'b',
      }),
    ).rejects.toMatchObject({ code: 'RESPUESTA_INVALIDA' });
  });
});

describe('operaciones sobre un árbol (RF-25C)', () => {
  it.each([
    ['nueva versión', crearNuevaVersionArbol, 'nueva-version'],
    ['publicar', publicarArbolPersonalizado, 'publicar'],
    ['archivar', archivarArbolPersonalizado, 'archivar'],
  ])(
    '%s hace POST con cuerpo {} (nunca null)',
    async (_nombre, funcion, ruta) => {
      apiClient.post.mockResolvedValue({
        status: 200,
        data: { id_flujo: 'f-2' },
      });

      await expect(funcion('f-1')).resolves.toEqual({ id_flujo: 'f-2' });
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${BASE.source}/f-1/${ruta}$`)),
        {},
      );
    },
  );

  it('propaga el mensaje del backend (por ejemplo, un árbol incompleto)', async () => {
    apiClient.post.mockRejectedValue({
      response: {
        status: 409,
        data: {
          codigo: 'ARBOL_INVALIDO',
          message: 'El árbol no está completo.',
        },
      },
    });

    await expect(publicarArbolPersonalizado('f-1')).rejects.toMatchObject({
      status: 409,
      backendMessage: 'El árbol no está completo.',
    });
  });
});
