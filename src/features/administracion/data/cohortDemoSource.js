import { SCHEDULE_STATUS } from '../types/scheduleStatus.js';
import { DEMO_SCENARIO, getDemoScenario } from '../utils/cohortDemoScenario.js';
import { DEMO_COHORTS } from './cohortDemoData.js';
import { createCohortStore } from './cohortDemoStore.js';
import { DEMO_SCHEDULES } from './scheduleDemoData.js';

/*
 * FUENTE DE DEMOSTRACIÓN (solo desarrollo). Solo la carga
 * cohortSource.js mediante import() dinámico cuando el modo demo está
 * activo; en producción este módulo no llega al build.
 *
 * Aplica el escenario de VITE_M08_DEMO_SCENARIO y una breve espera
 * para que la carga y el guardado se vean durante las pruebas.
 */
export const DEMO_DELAY_MS = 400;

let store = null;

function getStore() {
  if (!store) {
    const scenario = getDemoScenario();

    store = createCohortStore({
      cohorts: scenario === DEMO_SCENARIO.EMPTY ? [] : DEMO_COHORTS,
      schedules:
        scenario === DEMO_SCENARIO.NO_ACTIVE_SCHEDULES
          ? DEMO_SCHEDULES.filter(({ status }) => status !== SCHEDULE_STATUS.ACTIVE)
          : DEMO_SCHEDULES,
    });
  }

  return store;
}

const pause = () => new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));

async function read(operation) {
  const scenario = getDemoScenario();

  if (scenario === DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await pause();

  if (scenario === DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado del modo de demostración.');
  }

  return operation(getStore());
}

async function write(operation) {
  await pause();

  if (getDemoScenario() === DEMO_SCENARIO.SAVE_ERROR) {
    throw new Error('Error simulado al guardar en el modo de demostración.');
  }

  return operation(getStore());
}

export const listCohorts = () => read((demo) => demo.listCohorts());
export const getCohort = (id) => read((demo) => demo.findCohort(id));
export const listSchedules = () => read((demo) => demo.listSchedules());
export const createCohort = (values) => write((demo) => demo.createCohort(values));
export const updateCohort = (id, values) => write((demo) => demo.updateCohort(id, values));

// Solo para pruebas automatizadas: simula una recarga de la aplicación.
export function resetDemoSource() {
  store = null;
}
