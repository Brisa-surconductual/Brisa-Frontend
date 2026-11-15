/*
 * Escenarios de demostración de la progresión narrativa
 * (VITE_M08_NARRATIVE_SCENARIO) y de la interacción con notificaciones
 * (VITE_M08_NOTIFICATIONS_SCENARIO). Independientes entre sí y de los de
 * la ficha, el historial y el listado. Solo los usa la fuente de
 * demostración, que no llega al build de producción. No son respuestas
 * reales del backend; la autorización simulada no es seguridad real.
 *
 * Comunes:
 * - carga: la consulta no termina;
 * - error: la consulta falla (500);
 * - denegado: la fuente responde DENEGADO e incluye datos, para
 *   comprobar que no se muestran (403);
 * - sin-datos: sin información (204);
 * - inexistente: la referencia no existe (404);
 * - otro-participante: la respuesta es de otro participante (409);
 * - otra-cohorte: la respuesta declara otra cohorte (409);
 * - no-disponible: M06 o M07 no disponible y sin datos anteriores (503;
 *   FA2 de RF-149);
 * - desactualizado: el backend entrega el último estado conocido marcado
 *   como DEGRADADO con su fecha exacta (RF-149);
 * - desactualizado-sin-fecha: DEGRADADO sin fecha confiable.
 * Propios:
 * - narrativa: sin-permiso-explicito (segundo 403 de RF-130) y
 *   sin-logros (progresión con la lista de logros vacía);
 * - notificaciones: no-calculable (todas las métricas NO_CALCULABLE,
 *   200 parcial de RF-131).
 */
const COMMON = Object.freeze({
  LOADING: 'carga',
  ERROR: 'error',
  DENIED: 'denegado',
  EMPTY: 'sin-datos',
  NOT_FOUND: 'inexistente',
  OTHER_PARTICIPANT: 'otro-participante',
  OTHER_COHORT: 'otra-cohorte',
  UNAVAILABLE: 'no-disponible',
  STALE: 'desactualizado',
  STALE_UNDATED: 'desactualizado-sin-fecha',
});

export const NARRATIVE_DEMO_SCENARIO = Object.freeze({
  DATA: 'narrativa',
  ...COMMON,
  PERMISSION_REQUIRED: 'sin-permiso-explicito',
  NO_ACHIEVEMENTS: 'sin-logros',
});

export const NOTIFICATIONS_DEMO_SCENARIO = Object.freeze({
  DATA: 'notificaciones',
  ...COMMON,
  NOT_CALCULABLE: 'no-calculable',
});

const pick = (catalog, value) => (Object.values(catalog).includes(value) ? value : catalog.DATA);

// Escenario de cada sección; un valor desconocido usa los datos.
export function getNarrativeDemoScenario(env = import.meta.env) {
  return pick(NARRATIVE_DEMO_SCENARIO, env.VITE_M08_NARRATIVE_SCENARIO);
}

export function getNotificationsDemoScenario(env = import.meta.env) {
  return pick(NOTIFICATIONS_DEMO_SCENARIO, env.VITE_M08_NOTIFICATIONS_SCENARIO);
}
