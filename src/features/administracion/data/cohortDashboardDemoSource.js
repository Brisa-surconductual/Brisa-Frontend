import {
  DASHBOARD_DEMO_SCENARIO,
  getDashboardDemoScenario,
} from '../utils/dashboardDemoScenario.js';

/*
 * FUENTE DE DEMOSTRACIÓN DEL PANEL PRINCIPAL (solo desarrollo). Solo la
 * carga cohortDashboardSource.js mediante import() dinámico cuando el
 * modo demo está activo; en producción no llega al build.
 *
 * No genera métricas propias: las vistas vienen de los mocks de RF-132,
 * RF-133 y RF-134. Solo simula, en el escenario caida-tras-carga, que
 * las fuentes dejan de responder después de su primera consulta.
 */
const served = new Set();

export function beforeDashboardQuery(section, cohortId) {
  if (getDashboardDemoScenario() !== DASHBOARD_DEMO_SCENARIO.OUTAGE_AFTER_LOAD)
    return;

  const key = `${cohortId}:${section}`;

  if (served.has(key)) {
    throw new Error('Caída simulada de la fuente del panel de demostración.');
  }

  served.add(key);
}

// Solo para pruebas.
export function resetDashboardDemo() {
  served.clear();
}
