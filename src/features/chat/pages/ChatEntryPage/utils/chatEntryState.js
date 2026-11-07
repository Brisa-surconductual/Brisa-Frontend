import { ESTADO_PANTALLA_ENTRADA } from '../../../types/estadoPantallaEntrada.js';

export const initialChatEntryState = Object.freeze({
  estado: ESTADO_PANTALLA_ENTRADA.CARGANDO,
  sesion: null,
  error: null,
});

export function chatEntryReducer(state, action) {
  switch (action.type) {
    case 'CARGANDO':
      return initialChatEntryState;

    case 'EXITO':
      return {
        estado: action.sesion.reanudada
          ? ESTADO_PANTALLA_ENTRADA.REANUDANDO
          : ESTADO_PANTALLA_ENTRADA.LISTA,
        sesion: action.sesion,
        error: null,
      };

    case 'ERROR':
      return {
        estado: ESTADO_PANTALLA_ENTRADA.ERROR,
        sesion: null,
        error: action.error,
      };

    default:
      return state;
  }
}
