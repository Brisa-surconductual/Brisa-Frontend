import { NOT_CALCULABLE, TRACKING_ACCESS, TRACKING_QUERY_ERROR } from '../types/participantTracking.js';
import {
  NARRATIVE_DEMO_SCENARIO,
  NOTIFICATIONS_DEMO_SCENARIO,
  getNarrativeDemoScenario,
  getNotificationsDemoScenario,
} from '../utils/engagementDemoScenario.js';
import { applyDegradedScenario } from './degradedDemo.js';
import { DEMO_NARRATIVE_PROGRESS, DEMO_NOTIFICATION_INTERACTION } from './engagementDemoData.js';
import { TRACKING_DEMO_DELAY_MS, resolveDemoParticipant } from './trackingDemoSource.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE M06 Y M07 PARA LA FICHA (solo desarrollo).
 * Solo la carga engagementSource.js mediante import() dinámico cuando el
 * modo demo está activo; en producción este módulo no llega al build.
 *
 * Simula RF-130 (progresión narrativa) y RF-131 (interacción con
 * notificaciones) como consultas separadas, cada una con su propia
 * autorización explícita simulada. Las respuestas incluyen a propósito
 * campos que la interfaz debe descartar (UUID, nivel de gamificación,
 * contenido de mensajes, eventos desencadenantes, correo).
 */
const pause = () => new Promise((resolve) => setTimeout(resolve, TRACKING_DEMO_DELAY_MS));

function codedError(code, message) {
  return Object.assign(new Error(message), { code });
}

/*
 * Pasos comunes: carga, error y no disponible antes de validar; después
 * la cohorte, la referencia y la pertenencia (resolveDemoParticipant).
 */
export async function begin(scenario, catalog, unavailableMessage) {
  if (scenario === catalog.LOADING) await new Promise(() => {});

  await pause();

  if (scenario === catalog.ERROR) throw new Error('Error simulado en la demostración.');

  if (scenario === catalog.UNAVAILABLE) {
    throw codedError(TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE, unavailableMessage);
  }
}

// Aislamiento y, en las fuentes que RF-149 cubre, modo degradado.
export function applyIsolationScenario(response, scenario, catalog) {
  if (scenario === catalog.DENIED) return { ...response, access: TRACKING_ACCESS.DENIED };
  if (scenario === catalog.OTHER_PARTICIPANT) return { ...response, reference: 'seg-otro000' };
  if (scenario === catalog.OTHER_COHORT) return { ...response, cohortId: 'otra-cohorte-ficticia' };

  return applyDegradedScenario(response, scenario);
}

export async function getParticipantNarrativeProgress(cohortId, reference) {
  const scenario = getNarrativeDemoScenario();
  const catalog = NARRATIVE_DEMO_SCENARIO;

  await begin(scenario, catalog, 'M06 no disponible en la demostración.');

  if (scenario === catalog.PERMISSION_REQUIRED) {
    throw codedError(TRACKING_QUERY_ERROR.EXPLICIT_PERMISSION_REQUIRED, 'Permiso explícito no concedido en la demostración.');
  }

  const participantId = resolveDemoParticipant(cohortId, reference, { forceNotFound: scenario === catalog.NOT_FOUND });
  const stored = scenario === catalog.EMPTY ? null : DEMO_NARRATIVE_PROGRESS[participantId] ?? null;
  const narrative = stored && {
    ...stored,
    achievements: scenario === catalog.NO_ACHIEVEMENTS
      ? []
      : stored.achievements?.map((item, index) => ({ ...item, achievementId: `logro-uuid-${index}`, rule: 'Regla interna ficticia' })) ?? null,
    // Campos de RF-116 que RF-130 no pide: la interfaz los descarta.
    narrativeProfileId: '00000000-0000-4000-8000-00000000a001',
    activePhaseId: '00000000-0000-4000-8000-00000000a002',
    lastCompletedChapterId: '00000000-0000-4000-8000-00000000a003',
    gamificationLevel: 4,
    progressState: 'ACTIVA',
  };

  return applyIsolationScenario({
    access: TRACKING_ACCESS.GRANTED,
    cohortId,
    reference,
    narrative,
    participantId,
    email: 'participante.ficticio@example.com',
  }, scenario, catalog);
}

export async function getParticipantNotificationInteraction(cohortId, reference) {
  const scenario = getNotificationsDemoScenario();
  const catalog = NOTIFICATIONS_DEMO_SCENARIO;

  await begin(scenario, catalog, 'M07 no disponible en la demostración.');

  const participantId = resolveDemoParticipant(cohortId, reference, { forceNotFound: scenario === catalog.NOT_FOUND });
  const stored = scenario === catalog.EMPTY ? null : DEMO_NOTIFICATION_INTERACTION[participantId] ?? null;
  const values = scenario === catalog.NOT_CALCULABLE && stored
    ? Object.fromEntries(Object.keys(stored).map((key) => [key, NOT_CALCULABLE]))
    : stored;
  const metrics = values && {
    ...values,
    // Contenido que la interfaz nunca debe mostrar (RF-102).
    lastMessage: 'Mensaje ficticio que nunca debe mostrarse.',
    triggerEvent: 'EVENTO_CLINICO_FICTICIO',
    notificationIds: ['00000000-0000-4000-8000-00000000b001'],
  };

  return applyIsolationScenario({
    access: TRACKING_ACCESS.GRANTED,
    cohortId,
    reference,
    metrics,
    participantId,
    email: 'participante.ficticio@example.com',
  }, scenario, catalog);
}
