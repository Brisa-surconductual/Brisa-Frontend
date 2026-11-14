import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { actualizarNodo } from './actualizarNodo.js';
import { archivarFlujo } from './archivarFlujo.js';
import { crearFlujoGrupal } from './crearFlujoGrupal.js';
import { crearNodo } from './crearNodo.js';
import { listarFlujos } from './listarFlujos.js';
import { obtenerArbolFlujo } from './obtenerArbolFlujo.js';
import { obtenerCatalogos } from './obtenerCatalogos.js';
import { publicarFlujo } from './publicarFlujo.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

beforeEach(() => vi.resetAllMocks());

describe('listarFlujos (RF-25)', () => {
  it('consulta /admin/flujos con los filtros y devuelve items y meta', async () => {
    const body = {
      data: { items: [{ id_flujo: 'f-1' }] },
      meta: { page: 2, page_size: 10, total: 11 },
    };
    apiClient.get.mockResolvedValue({ status: 200, data: body });

    await expect(
      listarFlujos({
        modalidad: 'GRUPAL',
        estado: 'BORRADOR',
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toEqual({ items: body.data.items, meta: body.meta });

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/flujos$/),
      {
        params: {
          page: 2,
          page_size: 10,
          modalidad: 'GRUPAL',
          estado: 'BORRADOR',
        },
      },
    );
  });

  it('no envía el filtro de estado vacío', async () => {
    apiClient.get.mockResolvedValue({
      status: 200,
      data: { data: { items: [] }, meta: { page: 1, page_size: 10, total: 0 } },
    });

    await listarFlujos({ modalidad: 'GRUPAL', estado: '' });

    expect(apiClient.get.mock.calls[0][1].params).not.toHaveProperty('estado');
  });

  it('rechaza una respuesta sin items o sin meta', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: { data: {} } });

    await expect(listarFlujos()).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });

  it('lanza el error tipado del backend', async () => {
    apiClient.get.mockRejectedValue({
      response: { status: 400, data: { message: 'Filtro inválido.' } },
    });

    await expect(listarFlujos()).rejects.toMatchObject({
      status: 400,
      backendMessage: 'Filtro inválido.',
    });
  });
});

describe('crearFlujoGrupal (RF-25)', () => {
  it('envía solo nombre y modalidad GRUPAL y devuelve el flujo', async () => {
    const flujo = {
      id_flujo: 'f-1',
      nombre: 'Grupal',
      estado: 'BORRADOR',
      version: 1,
    };
    apiClient.post.mockResolvedValue({ status: 201, data: { data: flujo } });

    await expect(crearFlujoGrupal({ nombre: 'Grupal' })).resolves.toEqual(
      flujo,
    );
    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/flujos$/),
      { nombre: 'Grupal', modalidad: 'GRUPAL' },
    );
  });

  it('rechaza una respuesta sin id_flujo', async () => {
    apiClient.post.mockResolvedValue({ status: 201, data: { data: {} } });

    await expect(crearFlujoGrupal({ nombre: 'x' })).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });

  it('propaga el mensaje del backend en un 400', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 400, data: { message: ['nombre no válido'] } },
    });

    await expect(crearFlujoGrupal({ nombre: 'x' })).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('obtenerCatalogos (RF-25)', () => {
  it('devuelve el contenido de `data`', async () => {
    const catalogos = { tipos_nodo: [], enums: { estado_flujo: ['BORRADOR'] } };
    apiClient.get.mockResolvedValue({ status: 200, data: { data: catalogos } });

    await expect(obtenerCatalogos()).resolves.toEqual(catalogos);
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/catalogos$/),
    );
  });

  it('rechaza un catálogo sin enums', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: { data: {} } });

    await expect(obtenerCatalogos()).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });
});

describe('obtenerArbolFlujo (RF-25)', () => {
  it('consulta el flujo por id y devuelve flujo, nodos y transiciones', async () => {
    const arbol = { flujo: { id_flujo: 'f-1' }, nodos: [], transiciones: [] };
    apiClient.get.mockResolvedValue({ status: 200, data: { data: arbol } });

    await expect(obtenerArbolFlujo('f-1')).resolves.toEqual(arbol);
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/flujos\/f-1$/),
    );
  });

  it('rechaza una respuesta incompleta', async () => {
    apiClient.get.mockResolvedValue({
      status: 200,
      data: { data: { flujo: {} } },
    });

    await expect(obtenerArbolFlujo('f-1')).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });

  it('propaga el 404 del backend con su mensaje', async () => {
    apiClient.get.mockRejectedValue({
      response: {
        status: 404,
        data: { codigo: 'FLUJO_NO_ENCONTRADO', message: 'No existe.' },
      },
    });

    await expect(obtenerArbolFlujo('x')).rejects.toMatchObject({
      status: 404,
      backendMessage: 'No existe.',
    });
  });
});

describe('crearNodo y actualizarNodo (RF-25)', () => {
  it('crearNodo hace POST al flujo con el payload y devuelve el nodo', async () => {
    const payload = {
      id_tipo_nodo: 't-1',
      contenido: { texto: 'Hola' },
      es_nodo_inicial: true,
    };
    apiClient.post.mockResolvedValue({
      status: 201,
      data: { data: { id_nodo: 'n-1' } },
    });

    await expect(crearNodo('f-1', payload)).resolves.toEqual({
      id_nodo: 'n-1',
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/flujos\/f-1\/nodos$/),
      payload,
    );
  });

  it('actualizarNodo hace PATCH al nodo solo con los cambios', async () => {
    apiClient.patch.mockResolvedValue({
      status: 200,
      data: { data: { id_nodo: 'n-1' } },
    });

    await actualizarNodo('n-1', { orden: null });
    expect(apiClient.patch).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/nodos\/n-1$/),
      { orden: null },
    );
  });

  it('propaga el mensaje del backend (flujo no editable, nodo inicial repetido)', async () => {
    apiClient.post.mockRejectedValue({
      response: {
        status: 409,
        data: {
          codigo: 'FLUJO_NO_EDITABLE',
          message: 'Solo un borrador se edita.',
        },
      },
    });

    await expect(crearNodo('f-1', {})).rejects.toMatchObject({
      status: 409,
      backendMessage: 'Solo un borrador se edita.',
    });
  });

  it('rechaza una respuesta sin id_nodo', async () => {
    apiClient.patch.mockResolvedValue({ status: 200, data: { data: {} } });

    await expect(actualizarNodo('n-1', { orden: 1 })).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });
});

describe('publicarFlujo y archivarFlujo (RF-25)', () => {
  it('publicarFlujo hace POST con cuerpo vacío y devuelve el flujo', async () => {
    const flujo = { id_flujo: 'f-1', estado: 'PUBLICADO', version: 1 };
    apiClient.post.mockResolvedValue({ status: 200, data: { data: flujo } });

    await expect(publicarFlujo('f-1')).resolves.toEqual(flujo);
    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/flujos\/f-1\/publicar$/),
      {},
    );
  });

  it('publicarFlujo propaga el 422 de un árbol inválido', async () => {
    apiClient.post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          codigo: 'GRAFO_INVALIDO',
          message: 'El árbol no cumple las condiciones de integridad.',
          detalles: { sin_nodo_inicial: true, nodos_huerfanos: [], ciclos: [] },
        },
      },
    });

    await expect(publicarFlujo('f-1')).rejects.toMatchObject({
      status: 422,
      code: 'GRAFO_INVALIDO',
      backendMessage: 'El árbol no cumple las condiciones de integridad.',
    });
  });

  it('archivarFlujo hace POST con cuerpo vacío y devuelve el flujo', async () => {
    const flujo = { id_flujo: 'f-1', estado: 'ARCHIVADO' };
    apiClient.post.mockResolvedValue({ status: 200, data: { data: flujo } });

    await expect(archivarFlujo('f-1')).resolves.toEqual(flujo);
    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat\/admin\/flujos\/f-1\/archivar$/),
      {},
    );
  });

  it('archivarFlujo propaga el 409 de un flujo ya archivado', async () => {
    apiClient.post.mockRejectedValue({
      response: {
        status: 409,
        data: {
          codigo: 'ESTADO_INVALIDO',
          message: 'El estado actual del flujo no permite esta operación.',
        },
      },
    });

    await expect(archivarFlujo('f-1')).rejects.toMatchObject({
      status: 409,
      backendMessage: 'El estado actual del flujo no permite esta operación.',
    });
  });

  it('rechaza una respuesta sin id_flujo', async () => {
    apiClient.post.mockResolvedValue({ status: 200, data: { data: {} } });

    await expect(publicarFlujo('f-1')).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
    await expect(archivarFlujo('f-1')).rejects.toMatchObject({
      code: 'RESPUESTA_INVALIDA',
    });
  });
});
