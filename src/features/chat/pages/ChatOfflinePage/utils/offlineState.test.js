import { describe, expect, it } from 'vitest';

import {
  ERROR_FALLO_ESCRITURA,
  ESTADO_OFFLINE,
  estadoInicialOffline,
  offlineReducer,
  selectItems,
  selectNodoFormulario,
} from './offlineState.js';

const nodo = (idNodo) => ({
  idNodo,
  bloques: [],
  entrada: null,
  esTerminal: false,
});
const actual = (idNodo) => ({
  nodo: nodo(idNodo),
  recursosNoPresentados: [],
  otrosNoPresentables: 0,
});

const cargado = offlineReducer(estadoInicialOffline, {
  type: 'CARGA_EXITO',
  datos: {
    paquete: {},
    actual: actual('n1'),
    pendientes: 0,
    completada: false,
  },
});
const guardando = offlineReducer(cargado, { type: 'GUARDAR' });

describe('estado de la conversación sin conexión', () => {
  it('solo avanza al nodo siguiente tras GUARDADO', () => {
    const siguiente = offlineReducer(guardando, {
      type: 'GUARDADO',
      textoRespuesta: '3/10',
      siguiente: actual('n2'),
      completada: false,
    });

    expect(siguiente).toMatchObject({
      estado: ESTADO_OFFLINE.LISTO,
      pendientes: 1,
      paso: 1,
    });
    expect(selectItems(siguiente).map((i) => i.id)).toEqual([
      'nodo-0',
      'respuesta-0',
      'nodo-1',
    ]);
    expect(selectNodoFormulario(siguiente).idNodo).toBe('n2');
  });

  it('GUARDADO sin escritura en curso no cambia nada', () => {
    expect(
      offlineReducer(cargado, {
        type: 'GUARDADO',
        textoRespuesta: null,
        siguiente: actual('n2'),
      }),
    ).toBe(cargado);
  });

  it('fallo de escritura: sigue en el mismo nodo, con el mensaje de RF-34', () => {
    const fallo = offlineReducer(guardando, { type: 'FALLO_ESCRITURA' });

    expect(fallo).toMatchObject({
      estado: ESTADO_OFFLINE.LISTO,
      errorRespuesta: ERROR_FALLO_ESCRITURA,
      pendientes: 0,
    });
    expect(selectNodoFormulario(fallo).idNodo).toBe('n1');
  });

  it('respuesta inválida: mensaje junto al formulario y sin avanzar', () => {
    const error = { codigo: 'FUERA_DE_RANGO', mensaje: 'x' };
    const invalida = offlineReducer(guardando, {
      type: 'RESPUESTA_INVALIDA',
      error,
    });

    expect(invalida).toMatchObject({
      estado: 'LISTO',
      errorRespuesta: error,
      paso: 0,
    });
  });

  it('bloqueo: el nodo queda a la vista sin formulario', () => {
    const bloqueado = offlineReducer(guardando, {
      type: 'BLOQUEO',
      codigo: 'NODO_AUSENTE',
    });

    expect(bloqueado).toMatchObject({
      estado: 'BLOQUEADO',
      bloqueo: 'NODO_AUSENTE',
    });
    expect(selectItems(bloqueado)).toHaveLength(1);
    expect(selectNodoFormulario(bloqueado)).toBeNull();
  });

  it('PENDIENTES actualiza el conteo tras sincronizar, salvo con una escritura en curso', () => {
    expect(
      offlineReducer(cargado, { type: 'PENDIENTES', pendientes: 3 }).pendientes,
    ).toBe(3);
    expect(
      offlineReducer(guardando, { type: 'PENDIENTES', pendientes: 3 }),
    ).toBe(guardando);
  });

  it('retomar con pendientes lo indica; completada no ofrece formulario', () => {
    const retomada = offlineReducer(estadoInicialOffline, {
      type: 'CARGA_EXITO',
      datos: {
        paquete: {},
        actual: actual('fin'),
        pendientes: 4,
        completada: true,
      },
    });

    expect(retomada).toMatchObject({ estado: 'COMPLETADA', retomada: true });
    expect(selectNodoFormulario(retomada)).toBeNull();
  });
});
