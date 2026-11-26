import { describe, expect, it } from 'vitest';

import {
  ESTADO_CONVERSACION as E,
  conversationReducer,
  crearEstadoInicial,
  esSesionCompletada,
  UMBRAL_RECHAZOS_VALIDACION,
  prepararInicio,
  selectHayRecursoNoDisponible,
  selectItems,
  selectMostrarDificultad,
  selectNodoFormulario,
  selectRecursosNoPresentados,
  selectSecuenciaSiguiente,
} from './conversationState.js';
import { mapHistorial } from '../../../services/historialInteracciones.js';
import { mapInicioSesion } from '../../../services/sesionConversacional.js';

import { crearCuerpo } from './envio.js';

const ID = '26000000-0000-4000-8000-000000000001';

const conversacion = (
  url = 'https://example.test/a.png?firma=1',
  idNodo = 'n1',
  extra = {},
) => ({
  idSesion: ID,
  estadoSesion: 'ACTIVA',
  nodo: {
    idNodo,
    esTerminal: false,
    bloques: [
      { orden: 1, tipo: 'TEXTO', texto: 'Hola' },
      { orden: 2, tipo: 'IMAGEN', url },
    ],
    entrada: { tipo: 'ESCALA', obligatorio: true, min: 0, max: 10, paso: 1 },
  },
  ...extra,
});

const nodoN2 = () => conversacion('https://example.test/b.png', 'n2');

const reducir = (acciones, estado = crearEstadoInicial(ID)) =>
  acciones.reduce(conversationReducer, estado);

const listo = () => reducir([{ type: 'EXITO', conversacion: conversacion() }]);

const envio = (
  cuerpo = crearCuerpo(conversacion().nodo, 7, { secuencia: 1 }),
) => ({
  cuerpo,
  textoRespuesta: '7/10',
});

const enviando = (e = envio()) =>
  conversationReducer(listo(), { type: 'ENVIAR', envio: e });

const error = (
  status,
  codigo,
  reintentable = status === null || status >= 500,
) => ({
  status,
  codigo,
  mensaje: `Mensaje ${codigo}`,
  reintentable,
});

describe('conversationState (RF-26)', () => {
  it('CARGANDO → LISTO con el item del nodo actual', () => {
    expect(crearEstadoInicial(ID).estado).toBe(E.CARGANDO);

    const estado = listo();

    expect(estado.estado).toBe(E.LISTO);
    expect(selectItems(estado)).toEqual([
      { tipo: 'nodo', id: 'nodo-0', nodo: conversacion().nodo, actual: true },
    ]);
    expect(selectNodoFormulario(estado)).toBe(estado.conversacion.nodo);
  });

  it('un error reintentable pasa a ERROR con el error intacto', () => {
    const e = {
      status: 500,
      codigo: 'CONTENIDO_NO_DISPONIBLE',
      reintentable: true,
    };
    const estado = reducir([{ type: 'ERROR', error: e }]);

    expect(estado.estado).toBe(E.ERROR);
    expect(estado.error).toBe(e);

    const reintento = conversationReducer(estado, { type: 'REINTENTAR' });

    expect(reintento.estado).toBe(E.CARGANDO);
    expect(reintento.recarga).toBe(estado.recarga + 1);
  });

  it('D7: dos fallos del mismo recurso piden como máximo una recarga', () => {
    const inicial = listo();
    const estado = reducir(
      [
        { type: 'RECURSO_ERROR', indice: 1 },
        { type: 'RECURSO_ERROR', indice: 1 },
      ],
      inicial,
    );

    expect(estado.recarga).toBe(inicial.recarga + 1);
    expect(estado.estado).toBe(E.LISTO);
    // Mientras recarga, el recurso aún no se marca.
    expect(selectItems(estado)[0].nodo.bloques[1].noDisponible).toBeUndefined();
  });

  it('D7: el reintento se consume una vez y el segundo fallo marca el recurso', () => {
    const inicial = listo();
    const estado = reducir(
      [
        { type: 'RECURSO_ERROR', indice: 1 },
        {
          type: 'EXITO',
          conversacion: conversacion('https://example.test/a.png?firma=2'),
        },
        { type: 'RECURSO_ERROR', indice: 1 },
      ],
      inicial,
    );

    expect(estado.recarga).toBe(inicial.recarga + 1);
    const [texto, imagen] = selectItems(estado)[0].nodo.bloques;
    expect(imagen.noDisponible).toBe(true);
    expect(texto.noDisponible).toBeUndefined();
  });

  it('D7: si la recarga falla, sigue en LISTO con el recurso marcado', () => {
    const estado = reducir(
      [
        { type: 'RECURSO_ERROR', indice: 1 },
        { type: 'ERROR', error: { status: null, reintentable: true } },
      ],
      listo(),
    );

    expect(estado.estado).toBe(E.LISTO);
    expect(selectItems(estado)[0].nodo.bloques[1].noDisponible).toBe(true);
  });

  it('D7: con URL nueva el recurso sale de fallidos; con la misma, sigue', () => {
    const recargando = reducir([{ type: 'RECURSO_ERROR', indice: 1 }], listo());
    const conUrlNueva = conversationReducer(recargando, {
      type: 'EXITO',
      conversacion: conversacion('https://example.test/a.png?firma=2'),
    });
    const mismaUrl = conversationReducer(recargando, {
      type: 'EXITO',
      conversacion: conversacion(),
    });

    expect(conUrlNueva.fallidos).toEqual([]);
    expect(mismaUrl.fallidos).toEqual([1]);
    expect(selectItems(mismaUrl)[0].nodo.bloques[1].noDisponible).toBe(true);
  });

  it('D16: la recarga de recursos se reinicia con cada nodo nuevo', () => {
    const gastada = reducir(
      [
        { type: 'RECURSO_ERROR', indice: 1 },
        { type: 'EXITO', conversacion: conversacion() },
      ],
      listo(),
    );
    expect(gastada.reintentoUsado).toBe(true);

    const avanzando = reducir(
      [
        { type: 'ENVIAR', envio: envio() },
        { type: 'ENVIO_EXITO', respuesta: { estadoSesion: 'ACTIVA' } },
        { type: 'EXITO', conversacion: nodoN2() },
      ],
      gastada,
    );
    expect(avanzando.reintentoUsado).toBe(false);
    expect(avanzando.fallidos).toEqual([]);

    const otra = conversationReducer(avanzando, {
      type: 'RECURSO_ERROR',
      indice: 1,
    });
    expect(otra.recarga).toBe(avanzando.recarga + 1);
  });

  it('D13: un idSesion sin forma de UUID no carga y redirige', () => {
    expect(crearEstadoInicial('no-es-uuid').estado).toBe(E.DIRECCION_INVALIDA);
    expect(crearEstadoInicial(undefined).estado).toBe(E.DIRECCION_INVALIDA);
  });
});

describe('envío y avance (RF-27 a RF-29)', () => {
  it('D12: una segunda confirmación durante el envío no cambia nada', () => {
    const estado = enviando();

    expect(estado.estado).toBe(E.ENVIANDO);
    expect(
      conversationReducer(estado, { type: 'ENVIAR', envio: envio() }),
    ).toBe(estado);
  });

  it('200 ACTIVA: burbuja, luego el nodo de RF-26 (CA-29-1, 29-2, 29-6)', () => {
    const tras200 = conversationReducer(enviando(), {
      type: 'ENVIO_EXITO',
      respuesta: { estadoSesion: 'ACTIVA' },
    });

    expect(tras200.estado).toBe(E.AVANZANDO);
    expect(tras200.recarga).toBe(listo().recarga + 1);
    expect(selectNodoFormulario(tras200)).toBeNull();
    // D12: mientras avanza tampoco sale otra petición.
    expect(
      conversationReducer(tras200, { type: 'ENVIAR', envio: envio() }),
    ).toBe(tras200);

    const avanzado = conversationReducer(tras200, {
      type: 'EXITO',
      conversacion: nodoN2(),
    });
    const items = selectItems(avanzado);

    expect(avanzado.estado).toBe(E.LISTO);
    expect(items.map((i) => i.id)).toEqual(['nodo-0', 'respuesta-0', 'nodo-1']);
    expect(items[1]).toEqual({
      tipo: 'respuesta',
      id: 'respuesta-0',
      texto: '7/10',
    });
    expect(items[1]).toBe(selectItems(tras200)[1]);
    expect(items[2]).toMatchObject({ actual: true, nodo: { idNodo: 'n2' } });
    expect(items[0].actual).toBeUndefined();
  });

  it('CONTINUAR no agrega burbuja', () => {
    const estado = reducir(
      [
        { type: 'ENVIAR', envio: { cuerpo: {}, textoRespuesta: null } },
        { type: 'ENVIO_EXITO', respuesta: { estadoSesion: 'ACTIVA' } },
      ],
      listo(),
    );

    expect(selectItems(estado).map((i) => i.tipo)).toEqual(['nodo']);
  });

  it('200 COMPLETADA: no pide nada más y no hay formulario (CA-29-3)', () => {
    const inicial = enviando();
    const estado = conversationReducer(inicial, {
      type: 'ENVIO_EXITO',
      respuesta: { estadoSesion: 'COMPLETADA' },
    });

    expect(estado.estado).toBe(E.COMPLETADA);
    // RF-25: se pide el nodo final para mostrar su contenido de cierre.
    expect(estado.recarga).toBe(inicial.recarga + 1);
    expect(selectNodoFormulario(estado)).toBeNull();
    expect(selectItems(estado).map((i) => i.id)).toEqual([
      'nodo-0',
      'respuesta-0',
    ]);
  });

  it('una recarga de recursos tardía no repone el nodo tras COMPLETADA', () => {
    const completada = reducir(
      [
        { type: 'RECURSO_ERROR', indice: 1 },
        { type: 'ENVIO_EXITO', respuesta: { estadoSesion: 'COMPLETADA' } },
      ],
      enviando(),
    );

    expect(
      conversationReducer(completada, {
        type: 'EXITO',
        conversacion: conversacion(),
      }),
    ).toBe(completada);
  });

  it('un GET con la sesión COMPLETADA no ofrece formulario', () => {
    const estado = reducir([
      {
        type: 'EXITO',
        conversacion: conversacion(undefined, 'n1', {
          estadoSesion: 'COMPLETADA',
        }),
      },
    ]);

    expect(estado.estado).toBe(E.COMPLETADA);
    expect(selectNodoFormulario(estado)).toBeNull();
  });

  it('RF-31: un nodo terminal completa la sesión aunque el estado diga ACTIVA', () => {
    const terminal = conversacion(undefined, 'fin');
    const estado = reducir([
      {
        type: 'EXITO',
        conversacion: {
          ...terminal,
          nodo: { ...terminal.nodo, esTerminal: true },
        },
      },
    ]);

    expect(estado.estado).toBe(E.COMPLETADA);
    expect(selectNodoFormulario(estado)).toBeNull();
    // El nodo terminal (el cierre) sigue en el hilo.
    expect(selectItems(estado).at(-1).nodo.idNodo).toBe('fin');
  });

  it('esSesionCompletada: por estado o por nodo terminal', () => {
    const con = (estadoSesion, esTerminal) => ({
      estadoSesion,
      nodo: { esTerminal },
    });

    expect(esSesionCompletada(con('COMPLETADA', false))).toBe(true);
    expect(esSesionCompletada(con('ACTIVA', true))).toBe(true);
    expect(esSesionCompletada(con('ACTIVA', false))).toBe(false);
    expect(esSesionCompletada(null)).toBe(false);
  });

  it('400: error inline, mismo nodo y respuesta descartada (CA-28-1 a 28-5)', () => {
    const inicial = enviando();
    const e = error(400, 'FUERA_DE_RANGO');
    const estado = conversationReducer(inicial, {
      type: 'ENVIO_ERROR',
      error: e,
    });

    expect(estado.estado).toBe(E.LISTO);
    expect(estado.errorEnvio).toBe(e);
    expect(estado.envio).toBeNull();
    expect(selectNodoFormulario(estado)).toBe(inicial.conversacion.nodo);
    expect(estado.recarga).toBe(inicial.recarga);
    // Sin cuerpo pendiente no hay reintento: la corrección lleva otro id.
    expect(conversationReducer(estado, { type: 'REINTENTAR_ENVIO' })).toBe(
      estado,
    );

    const corregida = envio();
    const otra = conversationReducer(estado, {
      type: 'ENVIAR',
      envio: corregida,
    });
    expect(otra.errorEnvio).toBeNull();
    expect(otra.envio.cuerpo.id_interaccion).not.toBe(
      inicial.envio.cuerpo.id_interaccion,
    );
  });

  it.each([
    ['5xx', error(500, 'SIN_TRANSICION')],
    ['sin conexión', error(null, 'SIN_CONEXION')],
  ])('%s: «Reintentar» reenvía el mismo cuerpo (CA-27-8, CA-29-5)', (_c, e) => {
    const inicial = enviando();
    const fallo = conversationReducer(inicial, {
      type: 'ENVIO_ERROR',
      error: e,
    });

    expect(fallo.estado).toBe(E.ERROR_ENVIO);
    expect(fallo.envio).toBe(inicial.envio);

    const reintento = conversationReducer(fallo, { type: 'REINTENTAR_ENVIO' });
    expect(reintento.estado).toBe(E.ENVIANDO);
    expect(reintento.envio.cuerpo).toBe(inicial.envio.cuerpo);
  });

  it('SECUENCIA_FUERA_DE_ORDEN: pide el nodo actual y descarta la respuesta (CA-27-9)', () => {
    const inicial = enviando();
    const e = error(409, 'SECUENCIA_FUERA_DE_ORDEN');
    const estado = conversationReducer(inicial, {
      type: 'ENVIO_ERROR',
      error: e,
    });

    expect(estado.estado).toBe(E.AVANZANDO);
    expect(estado.recarga).toBe(inicial.recarga + 1);
    expect(estado.envio).toBeNull();
    expect(estado.aviso).toBe(e);

    const recargado = conversationReducer(estado, {
      type: 'EXITO',
      conversacion: nodoN2(),
    });
    expect(recargado.estado).toBe(E.LISTO);
    expect(recargado.aviso).toBe(e);
    expect(selectItems(recargado).at(-1).nodo.idNodo).toBe('n2');

    // D15: desaparece con la siguiente acción de la estudiante.
    expect(
      conversationReducer(recargado, { type: 'ENVIAR', envio: envio() }).aviso,
    ).toBeNull();
  });

  it.each([
    error(400, 'TIPO_ENTRADA_NO_PERMITIDO'),
    error(403, 'DESCONOCIDO'),
    error(404, 'SESION_NO_ENCONTRADA'),
    error(409, 'CAPTURA_FUERA_DE_GRUPAL'),
  ])('%j: bloque sin reintento', (e) => {
    const estado = conversationReducer(enviando(), {
      type: 'ENVIO_ERROR',
      error: e,
    });

    expect(estado.estado).toBe(E.ERROR_ENVIO);
    expect(estado.errorEnvio).toBe(e);
    expect(estado.envio).toBeNull();
  });

  it('una recarga de recursos durante el envío no rehabilita el formulario', () => {
    const estado = reducir(
      [
        { type: 'RECURSO_ERROR', indice: 1 },
        { type: 'EXITO', conversacion: conversacion() },
      ],
      enviando(),
    );

    expect(estado.estado).toBe(E.ENVIANDO);
  });
});

const paginaHistorial = (extra = {}) => ({
  ultimaSecuencia: 7,
  hayMas: true,
  secuenciaMinima: 6,
  items: [
    { tipo: 'nodo', id: 'historial-i6-nodo', nodo: { idNodo: 'h6' } },
    { tipo: 'nodo', id: 'historial-i7-nodo', nodo: { idNodo: 'h7' } },
    { tipo: 'respuesta', id: 'historial-i7-respuesta', texto: 'Bien' },
  ],
  ...extra,
});

describe('historial y secuencia (RF-30, RF-32)', () => {
  it('el historial va antes del nodo actual y fija la secuencia (CA-32-1, CA-32-6)', () => {
    const estado = reducir([
      { type: 'EXITO', conversacion: conversacion() },
      { type: 'HISTORIAL_EXITO', pagina: paginaHistorial() },
    ]);

    expect(selectItems(estado).map((i) => i.id)).toEqual([
      'historial-i6-nodo',
      'historial-i7-nodo',
      'historial-i7-respuesta',
      'nodo-0',
    ]);
    expect(estado.historialEstado).toBe('LISTO');
    expect(estado.hayMas).toBe(true);
    expect(selectSecuenciaSiguiente(estado)).toBe(8);
  });

  it('el orden de llegada de nodo e historial no cambia el hilo', () => {
    const estado = reducir([
      { type: 'HISTORIAL_EXITO', pagina: paginaHistorial() },
      { type: 'EXITO', conversacion: conversacion() },
    ]);

    expect(selectItems(estado).at(-1).id).toBe('nodo-0');
    expect(selectItems(estado)).toHaveLength(4);
  });

  it('sin historial cargado la siguiente secuencia es 1', () => {
    expect(selectSecuenciaSiguiente(listo())).toBe(1);
  });

  it('cada envío exitoso adelanta la secuencia a la confirmada (CA-30-2)', () => {
    const estado = reducir(
      [
        {
          type: 'ENVIO_EXITO',
          respuesta: { estadoSesion: 'ACTIVA', secuencia: 4 },
        },
      ],
      enviando(),
    );

    expect(selectSecuenciaSiguiente(estado)).toBe(5);
  });

  it('un fallo del historial no impide responder el nodo actual (CA-32-5)', () => {
    const e = error(500, 'CONTENIDO_NO_DISPONIBLE');
    const estado = reducir([
      { type: 'EXITO', conversacion: conversacion() },
      { type: 'HISTORIAL_ERROR', error: e },
    ]);

    expect(estado.estado).toBe(E.LISTO);
    expect(estado.historialEstado).toBe('ERROR');
    expect(estado.historialError).toBe(e);
    expect(selectNodoFormulario(estado)).not.toBeNull();

    const reintento = conversationReducer(estado, {
      type: 'REINTENTAR_HISTORIAL',
    });
    expect(reintento.historialEstado).toBe('CARGANDO');
    expect(reintento.recargaHistorial).toBe(estado.recargaHistorial + 1);
  });

  it('cargar anteriores antepone sin duplicar y actualiza hay_mas (CA-32-2)', () => {
    const base = reducir([
      { type: 'EXITO', conversacion: conversacion() },
      { type: 'HISTORIAL_EXITO', pagina: paginaHistorial() },
      { type: 'CARGAR_ANTERIORES' },
    ]);
    expect(base.cargandoAnteriores).toBe(true);

    const estado = conversationReducer(base, {
      type: 'ANTERIORES_EXITO',
      pagina: paginaHistorial({
        hayMas: false,
        secuenciaMinima: 5,
        items: [
          { tipo: 'nodo', id: 'historial-i5-nodo', nodo: { idNodo: 'h5' } },
          { tipo: 'nodo', id: 'historial-i6-nodo', nodo: { idNodo: 'h6' } },
        ],
      }),
    });

    expect(selectItems(estado).map((i) => i.id)).toEqual([
      'historial-i5-nodo',
      'historial-i6-nodo',
      'historial-i7-nodo',
      'historial-i7-respuesta',
      'nodo-0',
    ]);
    expect(estado.hayMas).toBe(false);
    expect(estado.secuenciaMinima).toBe(5);
    expect(estado.cargandoAnteriores).toBe(false);
    // La página anterior no rebaja la secuencia conocida.
    expect(selectSecuenciaSiguiente(estado)).toBe(8);
  });

  it('sin más páginas, CARGAR_ANTERIORES no hace nada', () => {
    const estado = reducir([
      { type: 'HISTORIAL_EXITO', pagina: paginaHistorial({ hayMas: false }) },
    ]);

    expect(conversationReducer(estado, { type: 'CARGAR_ANTERIORES' })).toBe(
      estado,
    );
  });

  it('un fallo al cargar anteriores conserva el hilo y deja reintentar', () => {
    const e = error(null, 'SIN_CONEXION');
    const estado = reducir([
      { type: 'HISTORIAL_EXITO', pagina: paginaHistorial() },
      { type: 'CARGAR_ANTERIORES' },
      { type: 'ANTERIORES_ERROR', error: e },
    ]);

    expect(estado.cargandoAnteriores).toBe(false);
    expect(estado.errorAnteriores).toBe(e);
    expect(estado.historial).toHaveLength(3);
  });

  it.each(['SECUENCIA_FUERA_DE_ORDEN', 'NODO_TERMINAL', 'SESION_NO_ACTIVA'])(
    '%s resincroniza nodo e historial sin dejar el nodo viejo (CA-30-4)',
    (codigo) => {
      const inicial = reducir(
        [{ type: 'HISTORIAL_EXITO', pagina: paginaHistorial() }],
        enviando(),
      );
      const estado = conversationReducer(inicial, {
        type: 'ENVIO_ERROR',
        error: error(409, codigo),
      });

      expect(estado.estado).toBe(E.AVANZANDO);
      expect(estado.envio).toBeNull();
      expect(estado.recarga).toBe(inicial.recarga + 1);
      expect(estado.recargaHistorial).toBe(inicial.recargaHistorial + 1);

      const resincronizado = reducir(
        [
          {
            type: 'HISTORIAL_EXITO',
            pagina: paginaHistorial({ ultimaSecuencia: 9 }),
          },
          { type: 'EXITO', conversacion: nodoN2() },
        ],
        estado,
      );
      const ids = selectItems(resincronizado).map((i) => i.id);

      expect(ids.slice(0, 3)).toEqual([
        'historial-i6-nodo',
        'historial-i7-nodo',
        'historial-i7-respuesta',
      ]);
      expect(ids).toHaveLength(4);
      expect(selectItems(resincronizado).at(-1).nodo.idNodo).toBe('n2');
      expect(selectSecuenciaSiguiente(resincronizado)).toBe(10);
    },
  );
});

describe('recursos no presentados (RF-33, RF-30)', () => {
  const conIdRecurso = () => {
    const base = conversacion();

    return {
      ...base,
      nodo: {
        ...base.nodo,
        bloques: [
          base.nodo.bloques[0],
          { ...base.nodo.bloques[1], idRecurso: 'r1' },
        ],
      },
    };
  };

  it('solo cuenta el recurso que sigue caído tras el único reintento (CA-30-5)', () => {
    const tras1 = reducir([
      { type: 'EXITO', conversacion: conIdRecurso() },
      { type: 'RECURSO_ERROR', indice: 1 },
    ]);
    // Mientras se recarga todavía no se da por perdido.
    expect(selectRecursosNoPresentados(tras1)).toEqual([]);

    const recargado = conversationReducer(tras1, {
      type: 'EXITO',
      conversacion: conIdRecurso(),
    });
    expect(selectRecursosNoPresentados(recargado)).toEqual(['r1']);
  });

  it('un recurso sin idRecurso no se informa', () => {
    const estado = reducir(
      [
        { type: 'RECURSO_ERROR', indice: 1 },
        { type: 'EXITO', conversacion: conversacion() },
      ],
      listo(),
    );

    expect(selectRecursosNoPresentados(estado)).toEqual([]);
  });
});

// RF-32: respuesta de /iniciar con cinco respuestas guardadas.
const interaccion = (secuencia) => ({
  id_interaccion: `i${secuencia}`,
  secuencia,
  timestamp_interaccion: '2026-11-21T10:00:00.000Z',
  nodo: {
    id_nodo: `h${secuencia}`,
    tipo_nodo: 'PREGUNTA',
    bloques: [{ orden: 1, tipo: 'TEXTO', texto: `Pregunta ${secuencia}` }],
  },
  respuesta: {
    tipo_entrada: 'OPCION_UNICA',
    valor: `V${secuencia}`,
    etiqueta: `Respuesta ${secuencia}`,
  },
  id_nodo_destino: `h${secuencia + 1}`,
});

const respuestaIniciar = (extra = {}) => ({
  reanudada: true,
  recuperada_desde_historial: false,
  sesion: {
    id_sesion: ID,
    modalidad_activa: 'GRUPAL',
    tipo_dependencia: 'TOLERANCIA',
    tipo_craving: 'POSITIVO',
    estado_actual: 'ACTIVA',
    fecha_inicio: '2026-11-21T09:00:00.000Z',
    fecha_ultima_interaccion: '2026-11-21T10:00:00.000Z',
    ultima_secuencia: 5,
  },
  nodo_actual: {
    id_nodo: 'n6',
    tipo_nodo: 'PREGUNTA',
    es_terminal: false,
    disponibilidad: { habilitado: true, habilita_aprox: null },
    bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Pregunta 6' }],
    entrada: { tipo: 'ESCALA', obligatorio: true, min: 0, max: 10, paso: 1 },
  },
  historial_reciente: {
    items: [1, 2, 3, 4, 5].map(interaccion),
    hay_mas: false,
    siguiente_cursor: null,
  },
  ubicacion_temporal: { nombre_unidad: 'Semana 1', finalizado_programa: false },
  ...extra,
});

const textoDe = () => null;
const inicioDe = (data = respuestaIniciar()) =>
  prepararInicio(mapInicioSesion(data), textoDe);
const desdeIniciar = (data) => crearEstadoInicial(ID, inicioDe(data));

const PAGINA_GET = {
  items: [1, 2, 3, 4, 5].map(interaccion),
  hay_mas: false,
  siguiente_cursor: null,
};

const textosRespuesta = (estado) =>
  selectItems(estado)
    .filter((i) => i.tipo === 'respuesta')
    .map((i) => i.texto);

describe('reanudación con la respuesta de /iniciar (RF-32)', () => {
  it('presenta el historial reciente antes del nodo actual, sin pedir los GET', () => {
    const estado = desdeIniciar();
    const items = selectItems(estado);

    expect(estado.estado).toBe(E.LISTO);
    expect(estado.nodoPrecargado).toBe(true);
    expect(estado.historialPrecargado).toBe(true);
    expect(estado.recarga).toBe(0);
    expect(estado.recargaHistorial).toBe(0);
    expect(items).toHaveLength(11);
    expect(items.at(-1)).toMatchObject({
      actual: true,
      nodo: { idNodo: 'n6' },
    });
    expect(items.slice(0, -1).every((i) => i.id.startsWith('historial-'))).toBe(
      true,
    );
    expect(selectNodoFormulario(estado)?.idNodo).toBe('n6');
  });

  it('recupera cinco respuestas guardadas en orden', () => {
    const estado = desdeIniciar();

    expect(textosRespuesta(estado)).toEqual([
      'Respuesta 1',
      'Respuesta 2',
      'Respuesta 3',
      'Respuesta 4',
      'Respuesta 5',
    ]);
    expect(
      selectItems(estado)
        .filter((i) => i.tipo === 'nodo' && !i.actual)
        .map((i) => i.nodo.idNodo),
    ).toEqual(['h1', 'h2', 'h3', 'h4', 'h5']);
  });

  it('con ultima_secuencia 5 el próximo envío lleva secuencia 6', () => {
    const estado = desdeIniciar();
    const cuerpo = crearCuerpo(estado.conversacion.nodo, 7, {
      secuencia: selectSecuenciaSiguiente(estado),
    });

    expect(selectSecuenciaSiguiente(estado)).toBe(6);
    expect(cuerpo.secuencia).toBe(6);
  });

  it('ultima_secuencia manda aunque la página reciente llegue vacía', () => {
    const estado = desdeIniciar(
      respuestaIniciar({
        historial_reciente: { items: [], hay_mas: true, siguiente_cursor: 9 },
        sesion: { ...respuestaIniciar().sesion, ultima_secuencia: 9 },
      }),
    );

    expect(selectSecuenciaSiguiente(estado)).toBe(10);
  });

  it('conserva la paginación cuando hay_mas es verdadero', () => {
    const estado = desdeIniciar(
      respuestaIniciar({
        historial_reciente: {
          items: [4, 5].map(interaccion),
          hay_mas: true,
          siguiente_cursor: 4,
        },
      }),
    );

    expect(estado.hayMas).toBe(true);
    expect(estado.secuenciaMinima).toBe(4);

    const conAnteriores = reducir(
      [
        { type: 'CARGAR_ANTERIORES' },
        {
          type: 'ANTERIORES_EXITO',
          pagina: mapHistorial(
            {
              items: [3, 4].map(interaccion),
              hay_mas: false,
              siguiente_cursor: null,
            },
            textoDe,
          ),
        },
      ],
      estado,
    );

    expect(textosRespuesta(conAnteriores)).toEqual([
      'Respuesta 3',
      'Respuesta 4',
      'Respuesta 5',
    ]);
    expect(conAnteriores.hayMas).toBe(false);
  });

  it('recuperada_desde_historial: true queda marcada para el aviso', () => {
    const estado = desdeIniciar(
      respuestaIniciar({ recuperada_desde_historial: true }),
    );

    expect(estado.recuperadaDesdeHistorial).toBe(true);
    // El nodo es el que eligió el backend.
    expect(estado.conversacion.nodo.idNodo).toBe('n6');
  });

  it('recuperada_desde_historial: false no marca el aviso', () => {
    expect(desdeIniciar().recuperadaDesdeHistorial).toBe(false);
  });

  it('una sesión COMPLETADA sigue en solo lectura', () => {
    const estado = desdeIniciar(
      respuestaIniciar({
        reanudada: false,
        sesion: { ...respuestaIniciar().sesion, estado_actual: 'COMPLETADA' },
        nodo_actual: { ...respuestaIniciar().nodo_actual, es_terminal: true },
      }),
    );

    expect(estado.estado).toBe(E.COMPLETADA);
    expect(selectNodoFormulario(estado)).toBeNull();
    expect(textosRespuesta(estado)).toHaveLength(5);
  });

  it('una sesión nueva arranca con el nodo inicial y secuencia 1', () => {
    const estado = desdeIniciar(
      respuestaIniciar({
        reanudada: false,
        sesion: { ...respuestaIniciar().sesion, ultima_secuencia: 0 },
        historial_reciente: {
          items: [],
          hay_mas: false,
          siguiente_cursor: null,
        },
      }),
    );

    expect(selectItems(estado)).toHaveLength(1);
    expect(selectSecuenciaSiguiente(estado)).toBe(1);
  });

  it('datos de otro idSesion se ignoran y se carga por GET', () => {
    const otro = crearEstadoInicial(
      '26000000-0000-4000-8000-000000000099',
      inicioDe(),
    );

    expect(otro.estado).toBe(E.CARGANDO);
    expect(otro.nodoPrecargado).toBe(false);
    expect(otro.historialPrecargado).toBe(false);
  });

  it('sin historial_reciente solo se omite el GET del nodo', () => {
    const estado = desdeIniciar(
      respuestaIniciar({ historial_reciente: undefined }),
    );

    expect(estado.nodoPrecargado).toBe(true);
    expect(estado.historialPrecargado).toBe(false);
    expect(estado.historialEstado).toBe('CARGANDO');
    expect(selectSecuenciaSiguiente(estado)).toBe(6);
  });

  it('al recargar (F5) los GET restauran la misma conversación', () => {
    const recargada = reducir([
      { type: 'EXITO', conversacion: inicioDe().conversacion },
      { type: 'HISTORIAL_EXITO', pagina: mapHistorial(PAGINA_GET, textoDe) },
    ]);
    const precargada = desdeIniciar();

    expect(crearEstadoInicial(ID).estado).toBe(E.CARGANDO);
    expect(selectItems(recargada).map((i) => i.id)).toEqual(
      selectItems(precargada).map((i) => i.id),
    );
    expect(selectSecuenciaSiguiente(recargada)).toBe(6);
  });

  it('resincronizar con la misma página no duplica mensajes', () => {
    const estado = reducir(
      [
        { type: 'REINTENTAR_HISTORIAL' },
        { type: 'HISTORIAL_EXITO', pagina: mapHistorial(PAGINA_GET, textoDe) },
      ],
      desdeIniciar(),
    );
    const ids = selectItems(estado).map((i) => i.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(textosRespuesta(estado)).toHaveLength(5);
  });

  it('una resincronización tras /iniciar vuelve a pedir nodo e historial', () => {
    const estado = reducir(
      [
        {
          type: 'ENVIAR',
          envio: { cuerpo: { secuencia: 6 }, textoRespuesta: '7/10' },
        },
        { type: 'ENVIO_ERROR', error: error(409, 'SECUENCIA_FUERA_DE_ORDEN') },
      ],
      desdeIniciar(),
    );

    expect(estado.recarga).toBe(1);
    expect(estado.recargaHistorial).toBe(1);
  });
});

describe('respuestas tardías del historial (RF-32)', () => {
  it('una página antigua que llega después de responder no borra lo avanzado', () => {
    const tras = reducir(
      [
        { type: 'EXITO', conversacion: conversacion() },
        {
          type: 'ENVIAR',
          envio: { cuerpo: { secuencia: 1 }, textoRespuesta: '7/10' },
        },
        {
          type: 'ENVIO_EXITO',
          respuesta: { estadoSesion: 'ACTIVA', secuencia: 8 },
        },
        { type: 'EXITO', conversacion: nodoN2() },
        // Historial inicial pedido al montar, que llega tarde.
        { type: 'HISTORIAL_EXITO', pagina: paginaHistorial() },
      ],
      crearEstadoInicial(ID),
    );
    const ids = selectItems(tras).map((i) => i.id);

    expect(ids).toEqual([
      'historial-i6-nodo',
      'historial-i7-nodo',
      'historial-i7-respuesta',
      'nodo-0',
      'respuesta-0',
      'nodo-1',
    ]);
    expect(selectSecuenciaSiguiente(tras)).toBe(9);
  });
});

// RF-37: un envío con id_interaccion propio, para contar rechazos.
const envioCon = (idInteraccion) => ({
  cuerpo: crearCuerpo(conversacion().nodo, 7, {
    secuencia: 1,
    idInteraccion,
  }),
  textoRespuesta: '7/10',
});

const rechazo400 = () => ({
  ...error(400, 'FUERA_DE_RANGO'),
  mensaje: 'El valor ingresado está fuera del rango permitido.',
  campo: 'valor',
});

// Envía y recibe el error indicado sobre el estado dado.
const enviarYFallar = (estado, e, id = `i-${Math.random()}`) =>
  reducir(
    [
      { type: 'ENVIAR', envio: envioCon(id) },
      { type: 'ENVIO_ERROR', error: e },
    ],
    estado,
  );

describe('tres respuestas inválidas consecutivas (RF-37)', () => {
  it('un 400 muestra el mensaje del backend y deja la respuesta editable', () => {
    const e = rechazo400();
    const estado = enviarYFallar(listo(), e);

    expect(estado.estado).toBe(E.LISTO);
    expect(estado.errorEnvio).toBe(e);
    expect(estado.errorEnvio.mensaje).toBe(
      'El valor ingresado está fuera del rango permitido.',
    );
    expect(selectNodoFormulario(estado)?.idNodo).toBe('n1');
    expect(estado.rechazosValidacion).toBe(1);
  });

  it('el primer y el segundo rechazo no ofrecen ayuda; el tercero sí', () => {
    const uno = enviarYFallar(listo(), rechazo400());
    const dos = enviarYFallar(uno, rechazo400());
    const tres = enviarYFallar(dos, rechazo400());

    expect(selectMostrarDificultad(uno)).toBe(false);
    expect(selectMostrarDificultad(dos)).toBe(false);
    expect(UMBRAL_RECHAZOS_VALIDACION).toBe(3);
    expect(selectMostrarDificultad(tres)).toBe(true);
    // El hilo no se borra y la pregunta no se omite.
    expect(selectItems(tres).at(-1).nodo.idNodo).toBe('n1');
    expect(selectNodoFormulario(tres)).not.toBeNull();
  });

  it('no cuenta dos veces el mismo intento (mismo id_interaccion)', () => {
    const uno = enviarYFallar(listo(), rechazo400(), 'mismo');
    const repetido = enviarYFallar(uno, rechazo400(), 'mismo');

    expect(repetido.rechazosValidacion).toBe(1);
  });

  it.each([
    ['la red', error(null, 'SIN_CONEXION')],
    ['un 500', error(500, 'ERROR_PERSISTENCIA')],
    ['un 409', error(409, 'ID_INTERACCION_REUTILIZADA')],
    ['un 400 que no es de validación', error(400, 'TIPO_ENTRADA_NO_PERMITIDO')],
  ])('no cuenta %s como respuesta inválida', (_nombre, e) => {
    const estado = enviarYFallar(listo(), e);

    expect(estado.rechazosValidacion).toBe(0);
  });

  it('se reinicia cuando una respuesta es aceptada', () => {
    const dos = enviarYFallar(
      enviarYFallar(listo(), rechazo400()),
      rechazo400(),
    );
    const aceptada = reducir(
      [
        { type: 'ENVIAR', envio: envioCon('ok') },
        {
          type: 'ENVIO_EXITO',
          respuesta: { estadoSesion: 'ACTIVA', secuencia: 1 },
        },
        { type: 'EXITO', conversacion: nodoN2() },
      ],
      dos,
    );

    expect(aceptada.rechazosValidacion).toBe(0);
    expect(selectMostrarDificultad(enviarYFallar(aceptada, rechazo400()))).toBe(
      false,
    );
  });

  it('se reinicia cuando cambia realmente el nodo', () => {
    let estado = listo();
    for (let i = 0; i < 3; i += 1) estado = enviarYFallar(estado, rechazo400());
    estado = conversationReducer(estado, { type: 'PEDIR_AYUDA' });
    expect(estado.ayudaSolicitada).toBe(true);

    const mismoNodo = conversationReducer(estado, {
      type: 'EXITO',
      conversacion: conversacion(),
    });
    expect(mismoNodo.rechazosValidacion).toBe(3);

    const otroNodo = conversationReducer(estado, {
      type: 'EXITO',
      conversacion: nodoN2(),
    });
    expect(otroNodo.rechazosValidacion).toBe(0);
    expect(otroNodo.ayudaSolicitada).toBe(false);
  });

  it('«Pedir ayuda» no cambia el nodo ni el formulario', () => {
    let estado = listo();
    for (let i = 0; i < 3; i += 1) estado = enviarYFallar(estado, rechazo400());
    const ayuda = conversationReducer(estado, { type: 'PEDIR_AYUDA' });

    expect(ayuda.ayudaSolicitada).toBe(true);
    expect(selectNodoFormulario(ayuda)?.idNodo).toBe('n1');
    expect(selectItems(ayuda)).toEqual(selectItems(estado));
  });
});

describe('recuperación de errores 409 con /iniciar (RF-37)', () => {
  const recuperacionDe = (estadoSesion = 'ACTIVA', extra = {}) =>
    inicioDe(
      respuestaIniciar({
        sesion: { ...respuestaIniciar().sesion, estado_actual: estadoSesion },
        ...extra,
      }),
    );

  it('NODO_DESACTUALIZADO no repite la respuesta y pide /iniciar', () => {
    const inicial = enviando();
    const e = error(409, 'NODO_DESACTUALIZADO');
    const estado = conversationReducer(inicial, {
      type: 'ENVIO_ERROR',
      error: e,
    });

    expect(estado.estado).toBe(E.RECUPERANDO);
    expect(estado.recuperacion).toBe(inicial.recuperacion + 1);
    expect(estado.envio).toBeNull();
    expect(estado.aviso).toBe(e);
    // No se usan los GET ni se reenvía.
    expect(estado.recarga).toBe(inicial.recarga);
    expect(selectNodoFormulario(estado)).toBeNull();
  });

  it('restaura nodo, historial y secuencia de /iniciar sin duplicar', () => {
    const conHistorial = reducir(
      [
        { type: 'HISTORIAL_EXITO', pagina: mapHistorial(PAGINA_GET, textoDe) },
        { type: 'EXITO', conversacion: conversacion() },
        { type: 'ENVIAR', envio: envioCon('x') },
        { type: 'ENVIO_ERROR', error: error(409, 'NODO_DESACTUALIZADO') },
        { type: 'RECUPERACION_EXITO', inicio: recuperacionDe() },
      ],
      crearEstadoInicial(ID),
    );
    const ids = selectItems(conHistorial).map((i) => i.id);

    expect(conHistorial.estado).toBe(E.LISTO);
    expect(new Set(ids).size).toBe(ids.length);
    expect(textosRespuesta(conHistorial)).toEqual([
      'Respuesta 1',
      'Respuesta 2',
      'Respuesta 3',
      'Respuesta 4',
      'Respuesta 5',
    ]);
    expect(selectItems(conHistorial).at(-1).nodo.idNodo).toBe('n6');
    expect(selectSecuenciaSiguiente(conHistorial)).toBe(6);
    expect(conHistorial.aviso?.codigo).toBe('NODO_DESACTUALIZADO');
    expect(conHistorial.historialEstado).toBe('LISTO');
  });

  it('una recuperación que entrega la sesión COMPLETADA queda en solo lectura', () => {
    const estado = reducir(
      [
        { type: 'ENVIO_ERROR', error: error(409, 'NODO_DESACTUALIZADO') },
        {
          type: 'RECUPERACION_EXITO',
          inicio: recuperacionDe('COMPLETADA'),
        },
      ],
      enviando(),
    );

    expect(estado.estado).toBe(E.COMPLETADA);
    expect(selectNodoFormulario(estado)).toBeNull();
  });

  it('ESTADO_INCONSISTENTE: si /iniciar también falla no hay más reintentos automáticos', () => {
    const fallo = {
      ...error(409, 'ESTADO_INCONSISTENTE'),
      mensaje:
        'El estado de la conversación es inconsistente. No fue posible recuperar la sesión.',
    };
    const recuperando = conversationReducer(enviando(), {
      type: 'ENVIO_ERROR',
      error: fallo,
    });
    expect(recuperando.estado).toBe(E.RECUPERANDO);
    expect(recuperando.recuperacion).toBe(1);

    const caido = conversationReducer(recuperando, {
      type: 'RECUPERACION_ERROR',
      error: fallo,
    });
    expect(caido.estado).toBe(E.ERROR);
    expect(caido.error.mensaje).toBe(fallo.mensaje);
    expect(caido.recuperacion).toBe(1);

    // «Reintentar» consulta por GET (nodo e historial), no /iniciar.
    const reintento = conversationReducer(caido, { type: 'REINTENTAR' });
    expect(reintento.recuperacion).toBe(1);
    expect(reintento.recarga).toBe(caido.recarga + 1);
    expect(reintento.recargaHistorial).toBe(caido.recargaHistorial + 1);

    // Si el GET vuelve con el mismo código, se muestra; no se encadena.
    const otraVez = conversationReducer(reintento, {
      type: 'ERROR',
      error: fallo,
    });
    expect(otraVez.estado).toBe(E.ERROR);
    expect(otraVez.recuperacion).toBe(1);
  });

  it('un segundo NODO_DESACTUALIZADO antes de avanzar se resincroniza por GET', () => {
    const recuperado = reducir(
      [
        { type: 'ENVIO_ERROR', error: error(409, 'NODO_DESACTUALIZADO') },
        { type: 'RECUPERACION_EXITO', inicio: recuperacionDe() },
        { type: 'ENVIAR', envio: envioCon('y') },
        { type: 'ENVIO_ERROR', error: error(409, 'NODO_DESACTUALIZADO') },
      ],
      enviando(),
    );

    expect(recuperado.estado).toBe(E.AVANZANDO);
    expect(recuperado.recuperacion).toBe(1);
    expect(recuperado.recarga).toBeGreaterThan(0);
  });

  it('tras una respuesta aceptada se permite otra recuperación', () => {
    const estado = reducir(
      [
        { type: 'ENVIO_ERROR', error: error(409, 'NODO_DESACTUALIZADO') },
        { type: 'RECUPERACION_EXITO', inicio: recuperacionDe() },
        { type: 'ENVIAR', envio: envioCon('z') },
        {
          type: 'ENVIO_EXITO',
          respuesta: { estadoSesion: 'ACTIVA', secuencia: 6 },
        },
        { type: 'EXITO', conversacion: nodoN2() },
        { type: 'ENVIAR', envio: envioCon('w') },
        { type: 'ENVIO_ERROR', error: error(409, 'NODO_DESACTUALIZADO') },
      ],
      enviando(),
    );

    expect(estado.estado).toBe(E.RECUPERANDO);
    expect(estado.recuperacion).toBe(2);
  });

  it('una respuesta tardía de /iniciar fuera de la recuperación se ignora', () => {
    const estado = listo();

    expect(
      conversationReducer(estado, {
        type: 'RECUPERACION_EXITO',
        inicio: recuperacionDe(),
      }),
    ).toBe(estado);
  });

  it('los demás 409 conservan su tratamiento', () => {
    expect(
      enviarYFallar(listo(), error(409, 'SECUENCIA_FUERA_DE_ORDEN')).estado,
    ).toBe(E.AVANZANDO);
    expect(
      enviarYFallar(listo(), error(409, 'ID_INTERACCION_REUTILIZADA')).estado,
    ).toBe(E.ERROR_ENVIO);
  });
});

describe('fallos de carga y de red (RF-37)', () => {
  it('un 500 al enviar muestra el mensaje seguro y conserva la respuesta para reintentarla a mano', () => {
    const e = {
      ...error(500, 'ERROR_PERSISTENCIA'),
      mensaje: 'No se pudo guardar tu respuesta. Inténtalo de nuevo.',
    };
    const estado = enviarYFallar(listo(), e, 'mismo-id');

    expect(estado.estado).toBe(E.ERROR_ENVIO);
    expect(estado.errorEnvio.mensaje).toBe(e.mensaje);
    // D7: el reintento reusa el mismo id_interaccion; no hay reenvío
    // automático.
    expect(estado.envio.cuerpo.id_interaccion).toBe('mismo-id');
    expect(estado.recarga).toBe(listo().recarga);
  });

  it('una caída de red al enviar ofrece reintentar con el mismo cuerpo', () => {
    const estado = enviarYFallar(listo(), error(null, 'SIN_CONEXION'), 'r1');

    expect(estado.estado).toBe(E.ERROR_ENVIO);
    expect(estado.envio.cuerpo.id_interaccion).toBe('r1');
    expect(
      conversationReducer(estado, { type: 'REINTENTAR_ENVIO' }).estado,
    ).toBe(E.ENVIANDO);
  });

  it('503 RECURSO_NO_DISPONIBLE al cargar el nodo muestra el mensaje y permite un reintento', () => {
    const e = {
      ...error(503, 'RECURSO_NO_DISPONIBLE'),
      mensaje:
        'No fue posible cargar el contenido en este momento. Inténtalo de nuevo más tarde.',
    };
    const estado = conversationReducer(crearEstadoInicial(ID), {
      type: 'ERROR',
      error: e,
    });

    expect(estado.estado).toBe(E.ERROR);
    expect(estado.error.mensaje).toBe(e.mensaje);
    expect(estado.error.reintentable).toBe(true);
    expect(estado.recuperacion).toBe(0);
    expect(conversationReducer(estado, { type: 'REINTENTAR' }).recarga).toBe(1);
  });

  it('un recurso multimedia caído no afecta el resto de la conversación', () => {
    const estado = reducir(
      [
        { type: 'HISTORIAL_EXITO', pagina: paginaHistorial() },
        { type: 'RECURSO_ERROR', indice: 1 },
        { type: 'EXITO', conversacion: conversacion() },
        { type: 'RECURSO_ERROR', indice: 1 },
      ],
      listo(),
    );

    expect(selectHayRecursoNoDisponible(estado)).toBe(true);
    expect(estado.estado).toBe(E.LISTO);
    expect(selectItems(estado)).toHaveLength(4);
    expect(estado.recarga).toBe(1);
    expect(estado.envio).toBeNull();
  });
});

describe('nodo final al completar la sesión (RF-31, CA-31-4)', () => {
  const nodoFinal = (extra = {}) =>
    conversacion('https://example.test/fin.png?firma=1', 'fin', {
      estadoSesion: 'COMPLETADA',
      ...extra,
      nodo: {
        idNodo: 'fin',
        esTerminal: true,
        bloques: [
          { orden: 1, tipo: 'TEXTO', texto: 'Gracias por llegar hasta aquí.' },
          { orden: 2, tipo: 'IMAGEN', url: 'https://example.test/fin.png?f=1' },
        ],
        entrada: null,
        ...extra.nodo,
      },
    });

  const completadaPorEnvio = () =>
    reducir(
      [
        { type: 'HISTORIAL_EXITO', pagina: paginaHistorial() },
        {
          type: 'ENVIO_EXITO',
          respuesta: { estadoSesion: 'COMPLETADA', secuencia: 8 },
        },
      ],
      enviando(),
    );

  it('el envío completa la sesión y pide el nodo final', () => {
    const estado = completadaPorEnvio();

    expect(estado.estado).toBe(E.COMPLETADA);
    expect(estado.conversacion).toBeNull();
    expect(estado.recarga).toBe(enviando().recarga + 1);
  });

  it('el nodo final se muestra en cuanto llega, al final del hilo y sin formulario', () => {
    const estado = conversationReducer(completadaPorEnvio(), {
      type: 'EXITO',
      conversacion: nodoFinal(),
    });
    const items = selectItems(estado);

    expect(estado.estado).toBe(E.COMPLETADA);
    expect(items.at(-1)).toMatchObject({
      actual: true,
      nodo: { idNodo: 'fin', esTerminal: true },
    });
    expect(items.at(-1).nodo.bloques[0].texto).toBe(
      'Gracias por llegar hasta aquí.',
    );
    expect(selectNodoFormulario(estado)).toBeNull();
  });

  it('conserva el historial y la respuesta que cerró la sesión, sin duplicados', () => {
    const estado = conversationReducer(completadaPorEnvio(), {
      type: 'EXITO',
      conversacion: nodoFinal(),
    });
    const ids = selectItems(estado).map((i) => i.id);

    expect(ids).toEqual([
      'historial-i6-nodo',
      'historial-i7-nodo',
      'historial-i7-respuesta',
      'nodo-0',
      'respuesta-0',
      'nodo-1',
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('también acepta un nodo terminal aunque el estado diga ACTIVA', () => {
    const estado = conversationReducer(completadaPorEnvio(), {
      type: 'EXITO',
      conversacion: nodoFinal({ estadoSesion: 'ACTIVA' }),
    });

    expect(selectItems(estado).at(-1).nodo.idNodo).toBe('fin');
    expect(estado.estado).toBe(E.COMPLETADA);
  });

  it('no admite nuevas respuestas después del cierre', () => {
    const estado = conversationReducer(completadaPorEnvio(), {
      type: 'EXITO',
      conversacion: nodoFinal(),
    });

    expect(
      conversationReducer(estado, { type: 'ENVIAR', envio: envio() }),
    ).toBe(estado);
  });

  it('un nodo anterior que llega tarde no reemplaza ni duplica el nodo final', () => {
    const conFinal = conversationReducer(completadaPorEnvio(), {
      type: 'EXITO',
      conversacion: nodoFinal(),
    });

    expect(
      conversationReducer(conFinal, {
        type: 'EXITO',
        conversacion: conversacion(),
      }),
    ).toBe(conFinal);
  });

  it('volver a recibir el nodo final (recarga de recursos) no lo duplica', () => {
    const conFinal = conversationReducer(completadaPorEnvio(), {
      type: 'EXITO',
      conversacion: nodoFinal(),
    });
    const recargado = reducir(
      [
        { type: 'RECURSO_ERROR', indice: 1 },
        {
          type: 'EXITO',
          conversacion: nodoFinal({
            nodo: {
              bloques: [
                {
                  orden: 1,
                  tipo: 'TEXTO',
                  texto: 'Gracias por llegar hasta aquí.',
                },
                {
                  orden: 2,
                  tipo: 'IMAGEN',
                  url: 'https://example.test/fin.png?f=2',
                },
              ],
            },
          }),
        },
      ],
      conFinal,
    );

    expect(selectItems(recargado).map((i) => i.id)).toEqual(
      selectItems(conFinal).map((i) => i.id),
    );
    expect(recargado.recargando).toBe(false);
    expect(recargado.fallidos).toEqual([]);
    expect(recargado.estado).toBe(E.COMPLETADA);
  });

  it('una sesión ya completada que se recupera muestra su nodo final en solo lectura', () => {
    const estado = reducir([
      { type: 'HISTORIAL_EXITO', pagina: paginaHistorial() },
      { type: 'EXITO', conversacion: nodoFinal() },
    ]);

    expect(estado.estado).toBe(E.COMPLETADA);
    expect(selectItems(estado).at(-1).nodo.idNodo).toBe('fin');
    expect(selectItems(estado)).toHaveLength(4);
    expect(selectNodoFormulario(estado)).toBeNull();
  });
});
