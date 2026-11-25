import { getDashboardFromApi } from '../api/vistasAgregadasApi.js';
import { DASHBOARD_SECTION } from '../types/cohortDashboard.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

import { getBehavioralAggregate } from './behavioralAggregateSource.js';
import { getCohort, listCohorts } from './cohortSource.js';
import { getNarrativeAggregate } from './narrativeAggregateSource.js';
import { getNotificationAggregate } from './notificationAggregateSource.js';

/*
 * El panel consolidado es la fuente de RF-140. La demostración conserva
 * las tres consultas de vistas y sus escenarios independientes.
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
  isDemo: isCohortDemoEnabled,
  getDashboard: getDashboardFromApi,
  getCohort,
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
