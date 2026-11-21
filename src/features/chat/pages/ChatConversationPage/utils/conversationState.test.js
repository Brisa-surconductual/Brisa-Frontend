import { describe, expect, it } from 'vitest';

import {
  ESTADO_CONVERSACION as E,
  conversationReducer,
  crearEstadoInicial,
  esSesionCompletada,
  selectItems,
  selectNodoFormulario,
  selectRecursosNoPresentados,
  selectSecuenciaSiguiente,
} from './conversationState.js';
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
    expect(estado.recarga).toBe(inicial.recarga);
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

  it('NODO_DESACTUALIZADO: pide el nodo actual y descarta la respuesta (CA-27-9)', () => {
    const inicial = enviando();
    const e = error(409, 'NODO_DESACTUALIZADO');
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

  it.each([
    'NODO_DESACTUALIZADO',
    'SECUENCIA_FUERA_DE_ORDEN',
    'NODO_TERMINAL',
    'SESION_NO_ACTIVA',
  ])(
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
