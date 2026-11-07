import { describe, expect, it } from 'vitest';

import { ESTADO_PANTALLA_ENTRADA } from '../../../types/estadoPantallaEntrada.js';

import { chatEntryReducer, initialChatEntryState } from './chatEntryState.js';

describe('chatEntryReducer', () => {
  it('arranca en cargando', () => {
    expect(initialChatEntryState.estado).toBe(ESTADO_PANTALLA_ENTRADA.CARGANDO);
  });

  it('una sesión reanudada pasa a reanudando', () => {
    const next = chatEntryReducer(initialChatEntryState, {
      type: 'EXITO',
      sesion: { reanudada: true },
    });
    expect(next.estado).toBe(ESTADO_PANTALLA_ENTRADA.REANUDANDO);
  });

  it('una sesión nueva pasa a lista', () => {
    const next = chatEntryReducer(initialChatEntryState, {
      type: 'EXITO',
      sesion: { reanudada: false },
    });
    expect(next.estado).toBe(ESTADO_PANTALLA_ENTRADA.LISTA);
  });

  it('un error pasa a error y reintentar vuelve a cargando', () => {
    const conError = chatEntryReducer(initialChatEntryState, {
      type: 'ERROR',
      error: { mensaje: 'x' },
    });
    expect(conError.estado).toBe(ESTADO_PANTALLA_ENTRADA.ERROR);

    const reintento = chatEntryReducer(conError, { type: 'CARGANDO' });
    expect(reintento).toEqual(initialChatEntryState);
    expect(reintento.error).toBeNull();
  });
});
