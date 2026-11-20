import { OPERADOR_OFFLINE } from '../../types/operacionOffline.js';

/*
 * RF-29 sin conexión: elige el destino con las `transiciones` del nodo
 * del paquete. Regla 2 de la Etapa 3: gana la primera que se cumple
 * según `orden_evaluacion`.
 *
 * Operadores con semántica definida en el contrato 5a:
 * - SIEMPRE (`valor_condicion` null): se cumple siempre.
 * - ENTRE (`valor_condicion` [mínimo, máximo]): se cumple con un número
 *   dentro del intervalo, límites incluidos. Que los límites se incluyan
 *   es una interpretación pendiente de confirmar con backend.
 *
 * Un operador distinto, una condición mal formada o órdenes repetidos
 * detienen la evaluación (NO_SOPORTADA): no se adivina el destino.
 */
export const RESULTADO_TRANSICION = Object.freeze({
  DESTINO: 'DESTINO',
  SIN_TRANSICION: 'SIN_TRANSICION',
  NO_SOPORTADA: 'NO_SOPORTADA',
});

const { DESTINO, SIN_TRANSICION, NO_SOPORTADA } = RESULTADO_TRANSICION;

const noSoportada = (motivo) =>
  Object.freeze({ resultado: NO_SOPORTADA, motivo });

function intervalo(condicion) {
  if (!Array.isArray(condicion) || condicion.length !== 2) return null;

  const [min, max] = condicion;
  return Number.isFinite(min) && Number.isFinite(max) && min <= max
    ? { min, max }
    : null;
}

// true/false si la condición se evalúa; null si no está soportada.
function seCumple(transicion, valor) {
  switch (transicion.operador) {
    case OPERADOR_OFFLINE.SIEMPRE:
      return transicion.valor_condicion === null ? true : null;
    case OPERADOR_OFFLINE.ENTRE: {
      const rango = intervalo(transicion.valor_condicion);
      if (!rango) return null;
      return (
        typeof valor === 'number' && valor >= rango.min && valor <= rango.max
      );
    }
    default:
      return null;
  }
}

export function elegirTransicionLocal(transiciones, valor) {
  if (!Array.isArray(transiciones))
    return noSoportada('TRANSICIONES_MALFORMADAS');

  const ordenes = transiciones.map((t) => t?.orden_evaluacion);

  if (
    !ordenes.every(Number.isInteger) ||
    new Set(ordenes).size !== ordenes.length
  ) {
    return noSoportada('ORDEN_EVALUACION');
  }

  const ordenadas = [...transiciones].sort(
    (a, b) => a.orden_evaluacion - b.orden_evaluacion,
  );

  for (const transicion of ordenadas) {
    const cumple = seCumple(transicion, valor);

    if (cumple === null) return noSoportada(`OPERADOR_${transicion.operador}`);
    if (!cumple) continue;

    const destino = transicion.id_nodo_destino;
    if (typeof destino !== 'string' || destino.trim() === '') {
      return noSoportada('DESTINO_MALFORMADO');
    }

    return Object.freeze({ resultado: DESTINO, idNodoDestino: destino });
  }

  return Object.freeze({ resultado: SIN_TRANSICION });
}
