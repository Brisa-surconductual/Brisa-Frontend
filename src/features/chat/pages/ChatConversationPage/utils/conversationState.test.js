import { describe, expect, it } from 'vitest';

import {
  ESTADO_CONVERSACION as E,
  conversationReducer,
  crearEstadoInicial,
  selectItems,
  selectNodoFormulario,
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

const envio = (cuerpo = crearCuerpo(conversacion().nodo, 7)) => ({
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
    expect(otra.envio.cuerpo.idRespuesta).not.toBe(
      inicial.envio.cuerpo.idRespuesta,
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
    error(409, 'NODO_TERMINAL'),
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
