import { AGGREGATE_VIEW_STATUS } from '../types/behavioralAggregate.js';
import {
  DASHBOARD_QUERY_TIMEOUT_MS,
  DASHBOARD_SECTION,
  DASHBOARD_SECTIONS,
  DASHBOARD_TIMEOUT_CODE,
  PANEL_SOURCE,
  SECTION_OUTCOME,
  VIEW_AVAILABILITY,
} from '../types/cohortDashboard.js';

import { aggregateStatusFromError } from './aggregateViewEnvelope.js';
import { interpretBehavioralAggregate } from './behavioralAggregateResponse.js';
import { interpretNarrativeAggregate } from './narrativeAggregateResponse.js';
import { interpretNotificationAggregate } from './notificationAggregateResponse.js';

/*
 * Los estados y los intérpretes de RF-132, RF-133 y RF-134 se comparten
 * entre el panel HTTP y la demostración. La demostración orquesta las
 * fuentes locales y calcula su total de alertas.
 *
 * En demostración, las consultas se lanzan con Promise.allSettled: cada una
 * tiene su propio tiempo límite y su propio resultado, de modo que el
 * fallo o la demora de una no cambia el estado de las otras.
 */
const INTERPRETERS = Object.freeze({
  [DASHBOARD_SECTION.BEHAVIORAL]: interpretBehavioralAggregate,
  [DASHBOARD_SECTION.NARRATIVE]: interpretNarrativeAggregate,
  [DASHBOARD_SECTION.NOTIFICATIONS]: interpretNotificationAggregate,
});

const WITH_DATA = Object.freeze([
  AGGREGATE_VIEW_STATUS.READY,
  AGGREGATE_VIEW_STATUS.STALE,
]);

export const viewHasData = (view) =>
  WITH_DATA.includes(view?.status) && Boolean(view.data);

function timeoutError() {
  return Object.assign(new Error('La consulta superó el tiempo límite.'), {
    code: DASHBOARD_TIMEOUT_CODE,
  });
}

// Rechaza si `promise` no termina dentro de `ms`; no cancela la consulta.
export function withTimeout(promise, ms = DASHBOARD_QUERY_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(timeoutError()), ms);

    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Una consulta, protegida aunque la función falle de forma síncrona.
const timedQuery = (query, cohortId, timeoutMs) =>
  withTimeout(
    Promise.resolve().then(() => query(cohortId)),
    timeoutMs,
  );

// Resultado de una sección a partir de su promesa resuelta o rechazada.
function toSectionResult(section, settled, cohortId) {
  if (settled.status === 'rejected') {
    const isTimeout = settled.reason?.code === DASHBOARD_TIMEOUT_CODE;

    return Object.freeze({
      section,
      outcome: isTimeout ? SECTION_OUTCOME.TIMEOUT : SECTION_OUTCOME.REJECTED,
      view: Object.freeze({
        status: isTimeout
          ? AGGREGATE_VIEW_STATUS.ERROR
          : aggregateStatusFromError(settled.reason),
        data: null,
      }),
    });
  }

  return interpretDashboardSection(section, settled.value, cohortId);
}

export function interpretDashboardSection(section, response, cohortId) {
  try {
    return Object.freeze({
      section,
      outcome: SECTION_OUTCOME.RESPONDED,
      view: INTERPRETERS[section](response, cohortId),
    });
  } catch {
    // Error al ensamblar la sección: nunca deja datos visibles.
    return Object.freeze({
      section,
      outcome: SECTION_OUTCOME.REJECTED,
      view: Object.freeze({ status: AGGREGATE_VIEW_STATUS.ERROR, data: null }),
    });
  }
}

/*
 * Consulta las tres vistas de la cohorte en paralelo. `queries` asocia
 * cada sección con su fachada (getBehavioralAggregate, ...). Nunca
 * rechaza: cada sección trae su propio resultado.
 */
export async function loadDashboardSections(
  cohortId,
  queries,
  timeoutMs = DASHBOARD_QUERY_TIMEOUT_MS,
) {
  const settled = await Promise.allSettled(
    DASHBOARD_SECTIONS.map((section) =>
      timedQuery(queries[section], cohortId, timeoutMs),
    ),
  );

  return Object.freeze(
    Object.fromEntries(
      DASHBOARD_SECTIONS.map((section, index) => [
        section,
        toSectionResult(section, settled[index], cohortId),
      ]),
    ),
  );
}

// Reintento de una sola sección, sin tocar las demás.
export async function loadDashboardSection(
  section,
  cohortId,
  queries,
  timeoutMs = DASHBOARD_QUERY_TIMEOUT_MS,
) {
  const [settled] = await Promise.allSettled([
    timedQuery(queries[section], cohortId, timeoutMs),
  ]);

  return toSectionResult(section, settled, cohortId);
}

// La fuente no respondió (falló o superó el tiempo límite).
export const isUnreachable = (result) =>
  result?.outcome === SECTION_OUTCOME.REJECTED ||
  result?.outcome === SECTION_OUTCOME.TIMEOUT;

// estado_disponibilidad_vista de una sección.
export function availabilityOf(result) {
  const status = result?.view?.status;

  if (
    status === AGGREGATE_VIEW_STATUS.READY ||
    status === AGGREGATE_VIEW_STATUS.NOT_CONSOLIDATED
  ) {
    return VIEW_AVAILABILITY.AVAILABLE;
  }

  if (status === AGGREGATE_VIEW_STATUS.STALE) return VIEW_AVAILABILITY.STALE;

  return VIEW_AVAILABILITY.NOT_AVAILABLE;
}

/*
 * total_alertas_criticas_pendientes: ÚNICA cifra que RF-140 permite
 * calcular, y solo como suma de alertas_inactividad_pendientes y
 * alertas_craving_pendientes de la vista conductual (RF-132). Si falta
 * cualquiera de las dos, el total es null («no disponible»), nunca 0.
 * Si la vista conductual está desactualizada, el total también.
 */
export function criticalAlertsTotal(behavioralView) {
  if (!viewHasData(behavioralView)) {
    return Object.freeze({ total: null, isStale: false });
  }

  const isStale = behavioralView.status === AGGREGATE_VIEW_STATUS.STALE;
  const { pendingInactivityAlerts, pendingCravingAlerts } = behavioralView.data;

  if (
    !Number.isInteger(pendingInactivityAlerts) ||
    !Number.isInteger(pendingCravingAlerts)
  ) {
    return Object.freeze({ total: null, isStale });
  }

  return Object.freeze({
    total: pendingInactivityAlerts + pendingCravingAlerts,
    isStale,
  });
}

// Guarda en la caché las vistas válidas que acaban de responder.
export function rememberValidSections(cache, cohortId, results, loadedAt) {
  for (const result of Object.values(results)) {
    if (result?.outcome === SECTION_OUTCOME.RESPONDED) {
      cache.remember(cohortId, result.section, result.view, loadedAt);
    }
  }
}

// Vista conservada, marcada explícitamente como desactualizada.
function cachedResult(section, entry) {
  return Object.freeze({
    section,
    outcome: SECTION_OUTCOME.CACHED,
    cachedAt: entry.loadedAt,
    view: Object.freeze({
      ...entry.view,
      status: AGGREGATE_VIEW_STATUS.STALE,
    }),
  });
}

/*
 * Ensambla el contrato lógico de RF-140 a partir de los resultados de
 * las tres secciones. Pura (solo lee la caché). Si ninguna fuente
 * respondió, cada sección usa su última vista válida conservada para esa
 * misma cohorte, si existe; nunca se fabrica una versión anterior.
 */
export function assembleDashboard({ cohortId, results, loadedAt, cache }) {
  const allUnreachable = DASHBOARD_SECTIONS.every((section) =>
    isUnreachable(results[section]),
  );

  let sections = results;
  let source = PANEL_SOURCE.LIVE;

  if (allUnreachable) {
    sections = Object.fromEntries(
      DASHBOARD_SECTIONS.map((section) => {
        const entry = cache.recall(cohortId, section);
        return [
          section,
          entry ? cachedResult(section, entry) : results[section],
        ];
      }),
    );

    source = DASHBOARD_SECTIONS.some(
      (section) => sections[section].outcome === SECTION_OUTCOME.CACHED,
    )
      ? PANEL_SOURCE.CACHED
      : PANEL_SOURCE.UNAVAILABLE;
  }

  const alerts = criticalAlertsTotal(
    sections[DASHBOARD_SECTION.BEHAVIORAL].view,
  );

  return Object.freeze({
    id_cohorte: cohortId,
    vista_conductual: sections[DASHBOARD_SECTION.BEHAVIORAL],
    vista_narrativa: sections[DASHBOARD_SECTION.NARRATIVE],
    vista_notificaciones: sections[DASHBOARD_SECTION.NOTIFICATIONS],
    total_alertas_criticas_pendientes: alerts.total,
    alertas_desactualizadas: alerts.isStale,
    fecha_carga_pantalla: loadedAt,
    origen_panel: source,
  });
}
