import { CONECTIVIDAD_INTERACCION } from '../types/index.js';

/*
 * Regla 6 de la Etapa 3: la conectividad sale de `navigator.onLine` y de
 * los eventos `online`/`offline`. Si una petición falla por red se pasa
 * a SIN_CONEXION aunque el navegador diga lo contrario, hasta el
 * siguiente evento `online`. `simulada` es solo de la demostración.
 */
export function resolverConectividad({
  navegadorEnLinea,
  falloDeRed = false,
  simulada = false,
}) {
  return navegadorEnLinea && !falloDeRed && !simulada
    ? CONECTIVIDAD_INTERACCION.EN_LINEA
    : CONECTIVIDAD_INTERACCION.SIN_CONEXION;
}

export const leerNavegadorEnLinea = (nav = globalThis.navigator) =>
  typeof nav?.onLine === 'boolean' ? nav.onLine : true;
