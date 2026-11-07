import { SCHEDULE_STATUS } from '../types/scheduleStatus.js';
import { DEMO_SCENARIO, getDemoScenario } from '../utils/cohortDemoScenario.js';
import { DEMO_COHORTS } from './cohortDemoData.js';
import { createCohortStore } from './cohortDemoStore.js';
import { DEMO_PARTICIPANTS } from './participantDemoData.js';
import { createParticipantStore } from './participantDemoStore.js';
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
let participantStore = null;

function getStore() {
  if (!store) {
    const scenario = getDemoScenario();

    store = createCohortStore({
      cohorts: scenario === DEMO_SCENARIO.EMPTY ? [] : DEMO_COHORTS,
      schedules: schedulesFor(scenario),
    });
  }

  return store;
}

function getParticipantStore() {
  if (!participantStore) {
    participantStore = createParticipantStore({ participants: DEMO_PARTICIPANTS });
  }

  return participantStore;
}

/*
 * Catálogo según el escenario: sin cronogramas activos, o con los
 * usados por las cohortes ya inactivos (para ver una activación
 * rechazada). Nunca modifica el catálogo original.
 */
function schedulesFor(scenario) {
  if (scenario === DEMO_SCENARIO.NO_ACTIVE_SCHEDULES) {
    return DEMO_SCHEDULES.filter(({ status }) => status !== SCHEDULE_STATUS.ACTIVE);
  }

  if (scenario === DEMO_SCENARIO.ACTIVATION_BLOCKED) {
    const inUse = new Set(DEMO_COHORTS.map(({ scheduleId }) => scheduleId));

    return DEMO_SCHEDULES.map((schedule) =>
      inUse.has(schedule.id) ? Object.freeze({ ...schedule, status: SCHEDULE_STATUS.INACTIVE }) : schedule,
    );
  }

  return DEMO_SCHEDULES;
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
export const changeCohortStatus = (id, transition) =>
  write((demo) => demo.changeCohortStatus(id, transition));

/*
 * Participantes de una cohorte (RF-125), o null si la cohorte no existe
 * en el almacén de cohortes (el mismo del listado, así una cohorte
 * creada o cambiada temporalmente se reconoce). Sus escenarios propios
 * permiten ver la carga y el error solo en esta consulta.
 */
export async function listCohortParticipants(cohortId) {
  const scenario = getDemoScenario();

  if (scenario === DEMO_SCENARIO.PARTICIPANTS_LOADING) return new Promise(() => {});

  return read((demo) => {
    if (scenario === DEMO_SCENARIO.PARTICIPANTS_ERROR) {
      throw new Error('Error simulado al consultar participantes en el modo de demostración.');
    }

    return demo.findCohort(cohortId) ? getParticipantStore().listByCohort(cohortId) : null;
  });
}

// Solo para pruebas automatizadas: simula una recarga de la aplicación.
export function resetDemoSource() {
  store = null;
  participantStore = null;
}
