import { describe, expect, it } from 'vitest';

import {
  initialProgramModalityState,
  programModalityReducer,
} from './programModalityState.js';

const reduce = (state, action) => programModalityReducer(state, action);
const elegibilidad = { id_programa: 1, elegible: true };

describe('programModalityReducer', () => {
  it('arranca cargando y sin datos', () => {
    expect(initialProgramModalityState).toMatchObject({
      status: 'loading',
      eligibility: null,
    });
  });

  it('carga la elegibilidad', () => {
    const next = reduce(initialProgramModalityState, {
      type: 'LOADED',
      eligibility: elegibilidad,
    });

    expect(next).toMatchObject({
      status: 'ready',
      eligibility: elegibilidad,
      loadError: '',
    });
  });

  it('un error no deja cifras viejas y reintentar vuelve a cargar', () => {
    const listo = reduce(initialProgramModalityState, {
      type: 'LOADED',
      eligibility: elegibilidad,
    });
    const fail = reduce(listo, {
      type: 'LOAD_ERROR',
      message: 'Sin permisos.',
    });

    expect(fail).toMatchObject({
      status: 'error',
      eligibility: null,
      loadError: 'Sin permisos.',
    });
    expect(reduce(fail, { type: 'RELOAD' })).toMatchObject({
      status: 'loading',
      reloadKey: 1,
    });
  });
});
