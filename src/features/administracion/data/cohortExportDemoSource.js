import { interpretBehavioralAggregate } from '../services/behavioralAggregateResponse.js';
import { viewHasData, withTimeout } from '../services/cohortDashboard.js';
import {
  buildCohortIndicatorsCsv,
  cohortIndicatorsFileName,
  projectCohortIndicators,
} from '../services/cohortExportProjection.js';
import { interpretNotificationAggregate } from '../services/notificationAggregateResponse.js';
import { AGGREGATE_VIEW_STATUS } from '../types/behavioralAggregate.js';
import { EXPORT_ERROR } from '../types/cohortExport.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';
import {
  EXPORT_DEMO_SCENARIO as SCENARIO,
  getExportDemoScenario,
} from '../utils/cohortExportDemoScenario.js';

import { getBehavioralAggregate } from './behavioralAggregateSource.js';
import { getCohort } from './cohortSource.js';
import { getNotificationAggregate } from './notificationAggregateSource.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE LA EXPORTACIÓN CSV (solo desarrollo). Solo la
 * carga cohortExportSource.js mediante import() dinámico cuando el modo
 * demo está activo; en producción no llega al build.
 *
 * Genera un CSV real en el navegador A PARTIR DE LAS MISMAS FUENTES que
 * las vistas RF-132 y RF-134 (y sus intérpretes), con la proyección de
 * lista blanca. No es la exportación de producción: allí el backend
 * genera el archivo con un DTO estricto y el frontend no ve datos crudos.
 *
 * AUDITORÍA SIMULADA: `simulatedAudit` solo representa el paso «registrar
 * antes de entregar el archivo» para poder demostrar que una falla
 * bloquea la descarga. No persiste nada, no es inmutable y no es la
 * bitácora de RF-123.
 */
export const EXPORT_DEMO_DELAY_MS = 300;

const pause = () =>
  new Promise((resolve) => setTimeout(resolve, EXPORT_DEMO_DELAY_MS));

const codedError = (code, message) =>
  Object.assign(new Error(message), { code });

function simulatedAudit(scenario, entry) {
  if (scenario === SCENARIO.AUDIT_FAILURE) {
    throw codedError(
      EXPORT_ERROR.AUDIT_UNAVAILABLE,
      'Bitácora simulada no disponible.',
    );
  }

  return Object.freeze({ ...entry, simulated: true });
}

// Registro simulado de un intento fallido: nunca cambia el resultado.
function auditFailure(scenario, entry) {
  try {
    simulatedAudit(scenario, entry);
  } catch {
    // La falla de la bitácora simulada no oculta el error original.
  }
}

// FA4: campos individuales añadidos a propósito a las vistas.
function withInjectedPii(view) {
  if (!view?.data) return view;

  return Object.freeze({
    status: view.status,
    lastAvailableAt: view.lastAvailableAt,
    aggregationState: view.aggregationState,
    message: view.message,
    data: Object.freeze(
      Object.assign(Object.create(null), view.data, {
        id_usuario: '00000000-0000-4000-8000-0000000000ff',
        nombre: 'Participante ficticio PII',
        correo: 'pii.ficticio@example.com',
        telefono: '+57 300 000 0000',
      }),
    ),
  });
}

/*
 * Equivale a GET /admin/cohortes/:id/exportacion.csv. `request` imita
 * los parámetros de la petición: se ignoran todos (la lista blanca no
 * depende de ellos), incluido include_pii (FA4).
 */
export async function exportCohortIndicatorsCsv(cohortId, request = {}) {
  // Los parámetros de la petición nunca amplían las columnas.
  void request;
  const scenario = getExportDemoScenario();
  const audit = { action: 'EXPORTACION_CSV', cohortId };

  await pause();

  if (scenario === SCENARIO.FORBIDDEN) {
    auditFailure(scenario, { ...audit, status: 'DENEGADA' });
    throw codedError(EXPORT_ERROR.FORBIDDEN, 'Sin privilegios (demo).');
  }

  const cohort = await getCohort(cohortId);

  if (!cohort || cohort.status !== COHORT_STATUS.ACTIVE) {
    auditFailure(scenario, { ...audit, status: 'FALLIDA' });
    throw codedError(EXPORT_ERROR.COHORT_NOT_ACTIVE, 'Cohorte no activa.');
  }

  const [behavioral, notifications] = await Promise.allSettled([
    withTimeout(getBehavioralAggregate(cohortId)),
    withTimeout(getNotificationAggregate(cohortId)),
  ]);

  let behavioralView =
    behavioral.status === 'fulfilled'
      ? interpretBehavioralAggregate(behavioral.value, cohortId)
      : null;
  let notificationView =
    notifications.status === 'fulfilled'
      ? interpretNotificationAggregate(notifications.value, cohortId)
      : null;

  // RF-132 es obligatorio.
  if (!viewHasData(behavioralView)) {
    auditFailure(scenario, { ...audit, status: 'FALLIDA' });

    const noData =
      behavioralView?.status === AGGREGATE_VIEW_STATUS.NOT_CONSOLIDATED;
    throw codedError(
      noData ? EXPORT_ERROR.NO_INDICATORS : EXPORT_ERROR.GENERATION_FAILED,
      'Indicadores conductuales no disponibles.',
    );
  }

  if (scenario === SCENARIO.PII_ATTEMPT) {
    behavioralView = withInjectedPii(behavioralView);
    notificationView = withInjectedPii(notificationView);
  }

  if (scenario === SCENARIO.GENERATION_ERROR) {
    auditFailure(scenario, { ...audit, status: 'FALLIDA' });
    throw codedError(EXPORT_ERROR.GENERATION_FAILED, 'Error simulado.');
  }

  const content = buildCohortIndicatorsCsv(
    projectCohortIndicators({
      cohortName: cohort.name,
      behavioralView,
      notificationView,
    }),
  );
  const fileName = cohortIndicatorsFileName(new Date());
  const sizeBytes = new TextEncoder().encode(content).length;

  // Antes de entregar el archivo: si la bitácora falla, no hay descarga.
  simulatedAudit(scenario, {
    ...audit,
    status: 'EXITOSA',
    fileName,
    sizeBytes,
  });

  return Object.freeze({
    fileName,
    content,
    sizeBytes,
    notificationsAvailable: viewHasData(notificationView),
    behavioralStale: behavioralView.status === AGGREGATE_VIEW_STATUS.STALE,
    simulatedAudit: true,
  });
}
