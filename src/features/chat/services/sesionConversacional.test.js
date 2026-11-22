import { describe, expect, it } from 'vitest';

import { CHAT_CLIENT_ERROR, createChatApiError } from '../api/chatApiUtils.js';

import {
  describirErrorInicio,
  errorInicioParaConversacion,
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
    ultima_secuencia: 5,
  },
  recuperada_desde_historial: false,
  nodo_actual: {
    id_nodo: 'n-1',
    tipo_nodo: 'PREGUNTA',
    es_terminal: false,
    disponibilidad: { habilitado: true, habilita_aprox: null },
    bloques: [
      { orden: 2, tipo: 'IMAGEN', url: 'https://example.test/a.png?firma=1' },
      { orden: 1, tipo: 'TEXTO', texto: 'Hola' },
    ],
    entrada: { tipo: 'ESCALA', obligatorio: true, min: 0, max: 10, paso: 1 },
  },
  historial_reciente: {
    items: [{ id_interaccion: 'i-5', secuencia: 5 }],
    hay_mas: true,
    siguiente_cursor: 5,
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
    expect(modelo.ubicacionTemporal.nombreUnidad).toBe('Semana 1');
    expect(JSON.stringify(modelo)).not.toMatch(/dependencia|craving/i);
  });

  it('RF-32: normaliza nodo_actual al modelo de RF-26 sin cambiar el nodo', () => {
    const { conversacion } = mapInicioSesion(respuesta);

    expect(conversacion.idSesion).toBe('s-1');
    expect(conversacion.estadoSesion).toBe('ACTIVA');
    expect(conversacion.nodo).toMatchObject({
      idNodo: 'n-1',
      tipoNodo: 'PREGUNTA',
      esTerminal: false,
      entrada: { tipo: 'ESCALA', min: 0, max: 10 },
    });
    expect(conversacion.nodo.bloques.map((b) => b.orden)).toEqual([1, 2]);
    expect(conversacion.nodo.bloques[0].texto).toBe('Hola');
    // RF-24/RF-22: `disponibilidad` pasa al modelo (nodo en espera).
    expect(conversacion.nodo.disponibilidad).toEqual({
      habilitado: true,
      habilitaAprox: null,
    });
  });

  it('RF-32: conserva historial_reciente, ultima_secuencia y recuperada_desde_historial', () => {
    const modelo = mapInicioSesion(respuesta);

    expect(modelo.sesion.ultimaSecuencia).toBe(5);
    expect(modelo.recuperadaDesdeHistorial).toBe(false);
    expect(modelo.historialReciente).toEqual({
      items: [{ id_interaccion: 'i-5', secuencia: 5 }],
      hay_mas: true,
      siguiente_cursor: 5,
    });
    expect(
      mapInicioSesion({ ...respuesta, recuperada_desde_historial: true })
        .recuperadaDesdeHistorial,
    ).toBe(true);
  });

  it('RF-32: sin historial_reciente ni ultima_secuencia válidos quedan en null', () => {
    const modelo = mapInicioSesion({
      ...respuesta,
      historial_reciente: undefined,
      sesion: { ...respuesta.sesion, ultima_secuencia: '5' },
    });

    expect(modelo.historialReciente).toBeNull();
    expect(modelo.sesion.ultimaSecuencia).toBeNull();
  });

  it('RF-32: no conserva el perfil clínico ni identificadores del árbol', () => {
    const modelo = mapInicioSesion(respuesta);
    const json = JSON.stringify(modelo);

    expect(json).not.toMatch(/dependencia|craving|TOLERANCIA|POSITIVO/i);
    expect(json).not.toContain('f-1');
    expect(modelo.sesion).not.toHaveProperty('idFlujoConversacional');
  });

  it('tolera una respuesta sin ubicación temporal', () => {
    const modelo = mapInicioSesion({ ...respuesta, ubicacion_temporal: null });
    expect(modelo.ubicacionTemporal).toBeNull();
  });

  it('marca como completada una sesión COMPLETADA y solo esa', () => {
    const completada = mapInicioSesion({
      ...respuesta,
      reanudada: false,
      sesion: { ...respuesta.sesion, estado_actual: 'COMPLETADA' },
    });
    expect(completada.completada).toBe(true);
    expect(completada.sesion.estadoActual).toBe('COMPLETADA');
    expect(completada.sesion.idSesion).toBe('s-1');

    for (const estado of ['ACTIVA', 'PAUSADA']) {
      expect(
        mapInicioSesion({
          ...respuesta,
          sesion: { ...respuesta.sesion, estado_actual: estado },
        }).completada,
      ).toBe(false);
    }
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

describe('errorInicioParaConversacion (RF-37)', () => {
  it('presenta un 409 de /iniciar con su mensaje, sin reintento automático', () => {
    const error = createChatApiError({
      code: 'ESTADO_INCONSISTENTE',
      status: 409,
      message: 'No fue posible recuperar la sesión.',
      requestId: 'req-9',
    });

    expect(errorInicioParaConversacion(error)).toEqual({
      status: 409,
      codigo: 'ESTADO_INCONSISTENTE',
      mensaje: 'No fue posible recuperar la sesión.',
      campo: null,
      reintentable: false,
      requestId: 'req-9',
    });
  });

  it('sin conexión es reintentable con el mensaje propio', () => {
    const error = createChatApiError({ code: CHAT_CLIENT_ERROR.SIN_CONEXION });

    expect(errorInicioParaConversacion(error)).toMatchObject({
      status: null,
      codigo: 'SIN_CONEXION',
      reintentable: true,
    });
    expect(errorInicioParaConversacion(error).mensaje).not.toBe('');
  });
});
