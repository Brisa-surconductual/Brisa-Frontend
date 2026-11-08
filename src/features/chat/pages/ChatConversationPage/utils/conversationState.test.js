import { describe, expect, it } from 'vitest';

import {
  ESTADO_CONVERSACION,
  conversationReducer,
  crearEstadoInicial,
  selectItems,
} from './conversationState.js';

const ID = '26000000-0000-4000-8000-000000000001';

const conversacion = (url = 'https://example.test/a.png?firma=1') => ({
  idSesion: ID,
  estadoSesion: 'ACTIVA',
  nodo: {
    idNodo: 'n1',
    bloques: [
      { orden: 1, tipo: 'TEXTO', texto: 'Hola' },
      { orden: 2, tipo: 'IMAGEN', url },
    ],
  },
});

const reducir = (acciones, estado = crearEstadoInicial(ID)) =>
  acciones.reduce(conversationReducer, estado);

const listo = () => reducir([{ type: 'EXITO', conversacion: conversacion() }]);

describe('conversationState (RF-26)', () => {
  it('CARGANDO → LISTO con un item de nodo', () => {
    expect(crearEstadoInicial(ID).estado).toBe(ESTADO_CONVERSACION.CARGANDO);

    const estado = listo();

    expect(estado.estado).toBe(ESTADO_CONVERSACION.LISTO);
    expect(selectItems(estado)).toEqual([
      { tipo: 'nodo', id: 'n1', nodo: conversacion().nodo },
    ]);
  });

  it('un error reintentable pasa a ERROR con el error intacto', () => {
    const error = {
      status: 500,
      codigo: 'CONTENIDO_NO_DISPONIBLE',
      reintentable: true,
    };
    const estado = reducir([{ type: 'ERROR', error }]);

    expect(estado.estado).toBe(ESTADO_CONVERSACION.ERROR);
    expect(estado.error).toBe(error);

    const reintento = conversationReducer(estado, { type: 'REINTENTAR' });

    expect(reintento.estado).toBe(ESTADO_CONVERSACION.CARGANDO);
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
    expect(estado.estado).toBe(ESTADO_CONVERSACION.LISTO);
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

    expect(estado.estado).toBe(ESTADO_CONVERSACION.LISTO);
    expect(selectItems(estado)[0].nodo.bloques[1].noDisponible).toBe(true);
  });

  it('D7: con URL nueva el recurso sale de fallidos; con otro nodo se limpian', () => {
    const recargando = reducir([{ type: 'RECURSO_ERROR', indice: 1 }], listo());
    const conUrlNueva = conversationReducer(recargando, {
      type: 'EXITO',
      conversacion: conversacion('https://example.test/a.png?firma=2'),
    });
    const mismaUrl = conversationReducer(recargando, {
      type: 'EXITO',
      conversacion: conversacion(),
    });
    const otroNodo = conversationReducer(recargando, {
      type: 'EXITO',
      conversacion: { ...conversacion(), nodo: { idNodo: 'n2', bloques: [] } },
    });

    expect(conUrlNueva.fallidos).toEqual([]);
    expect(mismaUrl.fallidos).toEqual([1]);
    expect(selectItems(mismaUrl)[0].nodo.bloques[1].noDisponible).toBe(true);
    expect(otroNodo.fallidos).toEqual([]);
  });

  it('D13: un idSesion sin forma de UUID no carga y redirige', () => {
    expect(crearEstadoInicial('no-es-uuid').estado).toBe(
      ESTADO_CONVERSACION.DIRECCION_INVALIDA,
    );
    expect(crearEstadoInicial(undefined).estado).toBe(
      ESTADO_CONVERSACION.DIRECCION_INVALIDA,
    );
  });
});
