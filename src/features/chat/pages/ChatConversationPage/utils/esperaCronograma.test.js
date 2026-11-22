import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

import { mapNodoActual } from '../../../services/nodoActual.js';
import { NodoEnEspera } from '../components/NodoEnEspera/NodoEnEspera.jsx';
import { textoHabilitacion } from './esperaCronograma.js';
import {
  ESTADO_CONVERSACION as E,
  conversationReducer,
  crearEstadoInicial,
  selectEspera,
  selectItems,
  selectNodoFormulario,
} from './conversationState.js';
import { ACCION_ERROR_ENVIO, clasificarErrorEnvio } from './envio.js';

// RF-24 / RF-22 · ritmo de la terapia según el cronograma.

const ID = '26000000-0000-4000-8000-000000000001';

const respuestaBackend = (disponibilidad) => ({
  idSesion: ID,
  estadoSesion: 'ACTIVA',
  nodo: {
    idNodo: 'n4',
    tipoNodo: 'PREGUNTA',
    orden: 4,
    esTerminal: false,
    disponibilidad,
    bloques: [],
    entrada: null,
  },
});

const cargar = (conversacion) =>
  conversationReducer(crearEstadoInicial(ID), {
    type: 'EXITO',
    conversacion,
  });

describe('nodo en espera del cronograma (CA-26-E1 a CA-26-E4)', () => {
  it('mapea la disponibilidad y asume habilitado si el backend no la envía', () => {
    expect(
      mapNodoActual(
        respuestaBackend({
          habilitado: false,
          habilitaAprox: '2026-12-01T12:00:00.000Z',
        }),
      ).nodo.disponibilidad,
    ).toEqual({ habilitado: false, habilitaAprox: '2026-12-01T12:00:00.000Z' });
    expect(
      mapNodoActual(respuestaBackend(undefined)).nodo.disponibilidad.habilitado,
    ).toBe(true);
  });

  it('un nodo en espera no muestra formulario ni burbuja, y expone la fecha', () => {
    const estado = cargar(
      mapNodoActual(
        respuestaBackend({
          habilitado: false,
          habilitaAprox: '2026-12-01T12:00:00.000Z',
        }),
      ),
    );

    expect(estado.estado).toBe(E.LISTO);
    expect(selectNodoFormulario(estado)).toBeNull();
    expect(selectItems(estado)).toEqual([]);
    expect(selectEspera(estado)).toEqual({
      habilitaAprox: '2026-12-01T12:00:00.000Z',
    });
  });

  it('un nodo habilitado sigue igual que antes', () => {
    const estado = cargar(
      mapNodoActual(
        respuestaBackend({ habilitado: true, habilitaAprox: null }),
      ),
    );

    expect(selectEspera(estado)).toBeNull();
    expect(selectNodoFormulario(estado)?.idNodo).toBe('n4');
  });

  it('el 409 NODO_EN_ESPERA_CRONOGRAMA resincroniza para mostrar la espera', () => {
    expect(
      clasificarErrorEnvio({
        status: 409,
        codigo: 'NODO_EN_ESPERA_CRONOGRAMA',
      }),
    ).toBe(ACCION_ERROR_ENVIO.DESACTUALIZADO);
  });

  it('la tarjeta muestra la fecha aproximada o un texto sin fecha', () => {
    const conFecha = renderToStaticMarkup(
      createElement(NodoEnEspera, {
        habilitaAprox: '2026-12-01T12:00:00.000Z',
        onVolverInicio: () => {},
      }),
    );
    const sinFecha = renderToStaticMarkup(
      createElement(NodoEnEspera, {
        habilitaAprox: null,
        onVolverInicio: () => {},
      }),
    );

    expect(conFecha).toContain(
      'Tu siguiente sesión se habilita aproximadamente el',
    );
    expect(conFecha).toContain('2026');
    expect(sinFecha).toContain('cuando avance tu cronograma');
    expect(textoHabilitacion('no-es-fecha')).toBeNull();
  });
});
