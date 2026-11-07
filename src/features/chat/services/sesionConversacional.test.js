import { describe, expect, it } from 'vitest';

import { CHAT_CLIENT_ERROR, createChatApiError } from '../api/chatApiUtils.js';

import {
  describirErrorInicio,
  mapInicioSesion,
} from './sesionConversacional.js';

const respuesta = {
  reanudada: true,
  sesion: {
    id_sesion: 's-1',
    id_flujo_conversacional: 'f-1',
    version_arbol_utilizada: 1,
    modalidad_activa: 'GRUPAL',
    tipo_dependencia: 'TOLERANCIA',
    tipo_craving: 'POSITIVO',
    estado_actual: 'ACTIVA',
    fecha_inicio: '2026-11-05T05:33:50.053Z',
    fecha_ultima_interaccion: '2026-11-05T05:40:00.000Z',
  },
  nodo_actual: {
    id_nodo: 'n-1',
    tipo_nodo: 'MENSAJE',
    contenido: { texto: 'Hola' },
    es_nodo_inicial: true,
    orden: 1,
  },
  ubicacion_temporal: {
    id_unidad_temporal: 'u-1',
    nombre_unidad: 'Semana 1',
    finalizado_programa: false,
  },
};

describe('mapInicioSesion', () => {
  it('traduce la respuesta y nunca conserva el perfil clínico', () => {
    const modelo = mapInicioSesion(respuesta);

    expect(modelo.reanudada).toBe(true);
    expect(modelo.sesion.idSesion).toBe('s-1');
    expect(modelo.nodoActual.contenido).toEqual({ texto: 'Hola' });
    expect(modelo.ubicacionTemporal.nombreUnidad).toBe('Semana 1');
    expect(JSON.stringify(modelo)).not.toMatch(/dependencia|craving/i);
  });

  it('tolera una respuesta sin ubicación temporal', () => {
    const modelo = mapInicioSesion({ ...respuesta, ubicacion_temporal: null });
    expect(modelo.ubicacionTemporal).toBeNull();
  });

  it('trata reanudada ausente como sesión nueva', () => {
    expect(
      mapInicioSesion({ ...respuesta, reanudada: undefined }).reanudada,
    ).toBe(false);
  });
});

describe('describirErrorInicio', () => {
  const error = (code, status, message = '') =>
    createChatApiError({ code, status, message });

  it('muestra el message del backend tal cual', () => {
    const r = describirErrorInicio(
      error('FLUJO_NO_DISPONIBLE', 404, 'Texto del backend.'),
    );
    expect(r).toEqual({
      mensaje: 'Texto del backend.',
      reintentable: false,
      requiereLogin: false,
    });
  });

  it('todo 5xx del catálogo es reintentable y ningún 4xx lo es', () => {
    expect(
      describirErrorInicio(error('ARBOL_NO_DISPONIBLE', 500, 'x')).reintentable,
    ).toBe(true);
    expect(
      describirErrorInicio(error('PERFIL_CLINICO_INCOMPLETO', 409, 'x'))
        .reintentable,
    ).toBe(false);
  });

  it('401 pide iniciar sesión, con o sin codigo', () => {
    expect(
      describirErrorInicio(error('NO_AUTENTICADO', 401)).requiereLogin,
    ).toBe(true);
    expect(
      describirErrorInicio(error(CHAT_CLIENT_ERROR.DESCONOCIDO, 401))
        .requiereLogin,
    ).toBe(true);
  });

  it('sin conexión es reintentable con mensaje propio', () => {
    const r = describirErrorInicio(error(CHAT_CLIENT_ERROR.SIN_CONEXION));
    expect(r.reintentable).toBe(true);
    expect(r.mensaje).toMatch(/conexión/);
  });

  it('un código desconocido 5xx es reintentable y usa mensaje genérico', () => {
    const r = describirErrorInicio(error('OTRO', 503));
    expect(r.reintentable).toBe(true);
    expect(r.mensaje).toMatch(/No fue posible/);
  });
});
