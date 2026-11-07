import { describe, expect, it } from 'vitest';

import {
  initialPersonalizedTreesState,
  personalizedTreesReducer,
} from './personalizedTreesState.js';

const reduce = (state, action) => personalizedTreesReducer(state, action);
const tree = { id_flujo: 'f-1', estado: 'BORRADOR' };

describe('personalizedTreesReducer', () => {
  it('arranca cargando y sin confirmación', () => {
    expect(initialPersonalizedTreesState).toMatchObject({
      status: 'loading',
      confirm: null,
    });
  });

  it('carga y error del listado', () => {
    const ok = reduce(initialPersonalizedTreesState, {
      type: 'LOADED',
      trees: [tree],
    });
    expect(ok).toMatchObject({ status: 'ready', trees: [tree] });

    expect(reduce(ok, { type: 'LOAD_ERROR', message: 'Falló.' })).toMatchObject(
      {
        status: 'error',
        loadError: 'Falló.',
      },
    );
  });

  it('abrir y cerrar la confirmación', () => {
    const abierta = reduce(initialPersonalizedTreesState, {
      type: 'CONFIRM_OPEN',
      action: 'PUBLICAR',
      tree,
    });

    expect(abierta.confirm).toEqual({ action: 'PUBLICAR', tree });
    expect(reduce(abierta, { type: 'CONFIRM_CLOSE' }).confirm).toBeNull();
  });

  it('una acción exitosa cierra la confirmación, avisa y recarga', () => {
    const next = reduce(
      {
        ...initialPersonalizedTreesState,
        busy: true,
        confirm: { action: 'PUBLICAR', tree },
      },
      { type: 'ACTION_OK', message: 'Árbol publicado.' },
    );

    expect(next).toMatchObject({
      busy: false,
      confirm: null,
      notice: 'Árbol publicado.',
      status: 'loading',
      reloadKey: 1,
    });
  });

  it('una acción fallida muestra el mensaje y no recarga', () => {
    const next = reduce(
      {
        ...initialPersonalizedTreesState,
        busy: true,
        confirm: { action: 'ARCHIVAR', tree },
      },
      { type: 'ACTION_ERROR', message: 'No se puede archivar.' },
    );

    expect(next).toMatchObject({
      busy: false,
      confirm: null,
      actionError: 'No se puede archivar.',
      reloadKey: 0,
    });
  });
});
