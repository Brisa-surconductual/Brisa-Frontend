import { AGGREGATE_VIEW_STATUS as VIEW } from '../types/behavioralAggregate.js';
import {
  DASHBOARD_SECTION,
  DASHBOARD_SECTIONS,
  DASHBOARD_STATUS as STATUS,
  PANEL_SOURCE,
} from '../types/cohortDashboard.js';
import { text, timestamp } from './aggregateViewEnvelope.js';
import { interpretDashboardSection, viewHasData } from './cohortDashboard.js';

const ACTIVE_STATES = [
  'DISPONIBLE',
  'PARCIAL',
  'DESACTUALIZADO',
  'NO_DISPONIBLE',
];
const CURRENT_VIEWS = [VIEW.READY, VIEW.NOT_CONSOLIDATED, VIEW.SUPPRESSED];

function panelSource(sections) {
  const views = DASHBOARD_SECTIONS.map((section) => sections[section].view);
  if (views.some(({ status }) => CURRENT_VIEWS.includes(status)))
    return PANEL_SOURCE.LIVE;
  return views.some(({ status }) => status === VIEW.STALE)
    ? PANEL_SOURCE.CACHED
    : PANEL_SOURCE.UNAVAILABLE;
}

export function interpretDashboardResponse(response) {
  if (response?.estado === 'SIN_COHORTE_ACTIVA' && response.id_cohorte === null)
    return { status: STATUS.NO_ACTIVE_COHORT };

  const cohortId = text(response?.id_cohorte);
  const loadedAt = timestamp(response?.fecha_carga_pantalla);
  if (!cohortId || !loadedAt || !ACTIVE_STATES.includes(response?.estado))
    return { status: STATUS.PANEL_ERROR };

  const degraded =
    response.estado === 'DESACTUALIZADO' || response.estado === 'NO_DISPONIBLE';
  const sections = Object.fromEntries(
    DASHBOARD_SECTIONS.map((section) => {
      const result = interpretDashboardSection(
        section,
        response[section],
        cohortId,
      );
      return [
        section,
        degraded && CURRENT_VIEWS.includes(result.view.status)
          ? interpretDashboardSection(section, null, cohortId)
          : result,
      ];
    }),
  );
  const behavioral = sections[DASHBOARD_SECTION.BEHAVIORAL].view;
  const total = response.total_alertas_criticas_pendientes;

  return {
    status: STATUS.READY,
    cohort: { id: cohortId },
    dashboard: {
      ...sections,
      id_cohorte: cohortId,
      fecha_carga_pantalla: loadedAt,
      total_alertas_criticas_pendientes:
        viewHasData(behavioral) && Number.isSafeInteger(total) && total >= 0
          ? total
          : null,
      alertas_desactualizadas: behavioral.status === VIEW.STALE,
      origen_panel: panelSource(sections),
    },
  };
}

export function dashboardStatusFromError(error) {
  if (error?.status === 401 || error?.status === 403)
    return STATUS.ACCESS_DENIED;
  if (error?.status === 409) {
    if (error.codigo === 'COHORTE_ACTIVA_AMBIGUA')
      return STATUS.MULTIPLE_ACTIVE_COHORTS;
    if (error.codigo === 'COHORTE_ACTIVA_CAMBIO') return STATUS.COHORTS_ERROR;
  }
  return STATUS.PANEL_ERROR;
}

export function replaceDashboardSection(dashboard, section, updated) {
  const result =
    updated?.[section] ??
    interpretDashboardSection(section, null, dashboard.id_cohorte);
  const next = { ...dashboard, [section]: result };
  if (section === DASHBOARD_SECTION.BEHAVIORAL) {
    next.total_alertas_criticas_pendientes =
      updated?.total_alertas_criticas_pendientes ?? null;
    next.alertas_desactualizadas = updated?.alertas_desactualizadas ?? false;
  }
  next.origen_panel = panelSource(next);
  return next;
}
