import { COHORT_SOURCE_MODE } from '../types/cohortSourceMode.js';
import { DASHBOARD_SECTION } from '../types/cohortDashboard.js';

import { getBehavioralAggregate } from './behavioralAggregateSource.js';
import { getCohortSourceMode, listCohorts } from './cohortSource.js';
import { getNarrativeAggregate } from './narrativeAggregateSource.js';
import { getNotificationAggregate } from './notificationAggregateSource.js';

/*
 * Fuentes del panel principal (RF-140). No añade integraciones: reutiliza
 * la fuente de cohortes (RF-124) y las tres fachadas de las vistas
 * agregadas, cada una con su propio mock en desarrollo. Sin el modo de
 * demostración no se consulta nada (integración pendiente).
 */

/*
 * Único punto que carga la demostración del panel. El import dinámico
 * está dentro de la condición del M08: en producción la rama se elimina.
 */
async function loadDashboardDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    return null;
  }

  return import('./cohortDashboardDemoSource.js');
}

// La consulta de una sección pasa antes por el escenario del panel.
const sectionQuery = (section, query) => async (cohortId) => {
  (await loadDashboardDemoSource())?.beforeDashboardQuery(section, cohortId);

  return query(cohortId);
};

export const DASHBOARD_SOURCE = Object.freeze({
  isIntegrationPending: () =>
    getCohortSourceMode() === COHORT_SOURCE_MODE.PENDING_INTEGRATION,
  listCohorts,
  queries: Object.freeze({
    [DASHBOARD_SECTION.BEHAVIORAL]: sectionQuery(
      DASHBOARD_SECTION.BEHAVIORAL,
      getBehavioralAggregate,
    ),
    [DASHBOARD_SECTION.NARRATIVE]: sectionQuery(
      DASHBOARD_SECTION.NARRATIVE,
      getNarrativeAggregate,
    ),
    [DASHBOARD_SECTION.NOTIFICATIONS]: sectionQuery(
      DASHBOARD_SECTION.NOTIFICATIONS,
      getNotificationAggregate,
    ),
  }),
});
