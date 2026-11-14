import { describe, expect, it } from 'vitest';

import { CHAT_CLIENT_ERROR, createChatApiError } from '../api/chatApiUtils.js';

import {
  ACCION_FLUJO,
  accionesEstadoDisponibles,
  describirCondicion,
  describirErrorAdmin,
  mapArbol,
  mapFlujo,
  mapListadoFlujos,
  validarNombreFlujo,
} from './flujosAdmin.js';

const flujoBackend = {
  id_flujo: 'f-1',
  nombre: 'Grupal base',
  modalidad: 'GRUPAL',
  estado: 'PUBLICADO',
  version: 2,
  creado_por: 'u-1',
  fecha_creacion: '2026-11-01T10:00:00.000Z',
  fecha_publicacion: '2026-11-02T10:00:00.000Z',
  tipo_dependencia: null,
  tipo_craving: null,
  fecha_archivado: null,
};

describe('mapFlujo', () => {
  it('traduce los campos del backend', () => {
    expect(mapFlujo(flujoBackend)).toEqual({
      id: 'f-1',
      nombre: 'Grupal base',
      estado: 'PUBLICADO',
      version: 2,
      fechaCreacion: '2026-11-01T10:00:00.000Z',
      fechaPublicacion: '2026-11-02T10:00:00.000Z',
      fechaArchivado: null,
    });
  });
});

describe('mapListadoFlujos', () => {
  it('calcula el total de páginas desde meta', () => {
    const listado = mapListadoFlujos({
      items: [flujoBackend],
      meta: { page: 1, page_size: 10, total: 21 },
    });

    expect(listado.totalPages).toBe(3);
    expect(listado.items).toHaveLength(1);
  });

  it('con total 0 hay una página', () => {
    expect(
      mapListadoFlujos({
        items: [],
        meta: { page: 1, page_size: 10, total: 0 },
      }).totalPages,
    ).toBe(1);
  });
});

describe('validarNombreFlujo', () => {
  it('rechaza vacío o solo espacios', () => {
    expect(validarNombreFlujo('')).not.toBe('');
    expect(validarNombreFlujo('   ')).not.toBe('');
    expect(validarNombreFlujo(undefined)).not.toBe('');
  });

  it('rechaza más de 150 caracteres', () => {
    expect(validarNombreFlujo('a'.repeat(151))).toMatch(/150/);
  });

  it('acepta un nombre válido', () => {
    expect(validarNombreFlujo(' Flujo grupal ')).toBe('');
    expect(validarNombreFlujo('a'.repeat(150))).toBe('');
  });
});

describe('describirErrorAdmin', () => {
  it('muestra el mensaje del backend tal cual', () => {
    const error = createChatApiError({
      code: 'X',
      status: 409,
      message: 'Ya existe.',
    });
    expect(describirErrorAdmin(error)).toBe('Ya existe.');
  });

  it('usa un texto propio sin conexión y otro genérico sin mensaje', () => {
    expect(
      describirErrorAdmin(
        createChatApiError({ code: CHAT_CLIENT_ERROR.SIN_CONEXION }),
      ),
    ).toMatch(/conexión/);
    expect(
      describirErrorAdmin(createChatApiError({ code: 'X', status: 500 })),
    ).toMatch(/No fue posible/);
  });
});

describe('accionesEstadoDisponibles', () => {
  it('un borrador puede publicarse o archivarse', () => {
    expect(accionesEstadoDisponibles('BORRADOR')).toEqual([
      ACCION_FLUJO.PUBLICAR,
      ACCION_FLUJO.ARCHIVAR,
    ]);
  });

  it('un publicado solo puede archivarse (no hay despublicar)', () => {
    expect(accionesEstadoDisponibles('PUBLICADO')).toEqual([
      ACCION_FLUJO.ARCHIVAR,
    ]);
  });

  it('un archivado no ofrece ninguna acción: es un estado sin retorno', () => {
    expect(accionesEstadoDisponibles('ARCHIVADO')).toEqual([]);
  });
});

describe('mapArbol', () => {
  const nodo = (id, extra = {}) => ({
    id_nodo: id,
    tipo_nodo: 'MENSAJE',
    contenido: { texto: `Texto ${id}` },
    es_nodo_inicial: false,
    orden: null,
    fecha_creacion: '2026-11-01T10:00:00.000Z',
    ...extra,
  });

  const arbol = {
    flujo: flujoBackend,
    nodos: [
      nodo('b', { orden: 2 }),
      nodo('c'),
      nodo('a', { es_nodo_inicial: true, orden: 1 }),
    ],
    transiciones: [
      {
        id_regla: 't2',
        id_nodo_origen: 'b',
        id_nodo_destino: 'zzz',
        operador_condicion: 'IGUALDAD',
        valor_condicion: { valor: 'Sí' },
        orden_evaluacion: 2,
      },
      {
        id_regla: 't1',
        id_nodo_origen: 'a',
        id_nodo_destino: 'b',
        operador_condicion: 'RANGO',
        valor_condicion: { min: 1, max: 5 },
        orden_evaluacion: 1,
      },
    ],
  };

  it('ordena el nodo inicial primero, luego por orden y deja sin orden al final', () => {
    expect(mapArbol(arbol).nodos.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('numera las etiquetas y conserva el texto tal cual', () => {
    const [primero] = mapArbol(arbol).nodos;

    expect(primero.etiqueta).toBe('1. Texto a');
    expect(primero.texto).toBe('Texto a');
  });

  it('resuelve origen y destino por nombre y marca los desconocidos', () => {
    const [t1, t2] = mapArbol(arbol).transiciones;

    expect(t1).toMatchObject({
      id: 't1',
      origen: '1. Texto a',
      destino: '2. Texto b',
    });
    expect(t2.destino).toBe('Nodo desconocido');
  });

  it('describe la condición sin inventar un formato', () => {
    expect(describirCondicion({ min: 1, max: 5 })).toBe('min: 1 · max: 5');
    expect(describirCondicion('Sí')).toBe('Sí');
    expect(describirCondicion(null)).toBe('');
  });

  it('un nodo sin texto se etiqueta como tal', () => {
    const sinTexto = mapArbol({
      ...arbol,
      nodos: [nodo('a', { contenido: {} })],
      transiciones: [],
    });

    expect(sinTexto.nodos[0].etiqueta).toBe('1. (sin texto)');
  });
});
