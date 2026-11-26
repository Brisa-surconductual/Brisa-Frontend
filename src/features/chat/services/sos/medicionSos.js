/*
 * RF-43: medición reproducible del tiempo de respuesta del botón SOS
 * (objetivo < 300 ms). Se distinguen dos tramos:
 *  - toque → interfaz SOS visible (no depende del backend);
 *  - toque → nodo real recibido del backend.
 * Se usan marcas de la User Timing API; en DevTools:
 *   performance.getEntriesByType('measure')
 *     .filter((m) => m.name.startsWith('brisa-sos:'))
 * No registran ningún dato del estudiante.
 */
const PREFIJO = 'brisa-sos';

export const MARCA_SOS = Object.freeze({
  TOQUE: 'toque',
  INTERFAZ: 'interfaz',
  NODO: 'nodo',
});

export const MEDIDA_SOS = Object.freeze({
  TOQUE_A_INTERFAZ: 'toque-a-interfaz',
  TOQUE_A_NODO: 'toque-a-nodo',
});

const nombre = (parte) => `${PREFIJO}:${parte}`;

function conPerformance(accion) {
  const perf = globalThis.performance;

  if (typeof perf?.mark !== 'function') return;

  try {
    accion(perf);
  } catch {
    // La medición nunca interrumpe el SOS.
  }
}

// El toque reinicia las marcas de la intervención anterior.
export function marcarToqueSos() {
  conPerformance((perf) => {
    for (const parte of [
      ...Object.values(MARCA_SOS),
      ...Object.values(MEDIDA_SOS),
    ]) {
      perf.clearMarks?.(nombre(parte));
      perf.clearMeasures?.(nombre(parte));
    }
    perf.mark(nombre(MARCA_SOS.TOQUE));
  });
}

export function marcarSos(marca, medida) {
  conPerformance((perf) => {
    perf.mark(nombre(marca));
    if (perf.getEntriesByName(nombre(MARCA_SOS.TOQUE)).length > 0) {
      perf.measure(nombre(medida), nombre(MARCA_SOS.TOQUE), nombre(marca));
    }
  });
}
