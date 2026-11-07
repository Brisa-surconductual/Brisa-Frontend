import { COHORT_SOURCE_MODE } from '../types/cohortSourceMode.js';
import {
  DEMO_SCENARIO,
  getDemoScenario,
  isCohortDemoEnabled,
} from '../utils/cohortDemoMode.js';

/*
 * Fuente de datos de cohortes que consumen los hooks.
 *
 * Hoy solo existe la fuente de demostración de desarrollo. Sin ella,
 * el modo es PENDING_INTEGRATION y no se consulta nada: el M08 aún
 * no está conectado al servidor. Al autorizarse la integración, esta
 * función delegará en un adaptador de `api/` y conservará la misma
 * firma; nunca se responderá con datos ficticios ante un error real.
 */
export const DEMO_DELAY_MS = 400;

export function getCohortSourceMode() {
  return isCohortDemoEnabled()
    ? COHORT_SOURCE_MODE.DEMO
    : COHORT_SOURCE_MODE.PENDING_INTEGRATION;
}

export async function listCohorts() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error('La consulta de cohortes aún no está integrada.');
  }

  // Import dinámico: en producción esta rama se elimina y los datos
  // ficticios no llegan al build.
  const { DEMO_COHORTS } = await import('./cohortDemoData.js');
  const scenario = getDemoScenario();

  if (scenario === DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));

  if (scenario === DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado del modo de demostración.');
  }

  return scenario === DEMO_SCENARIO.EMPTY ? [] : DEMO_COHORTS;
}
