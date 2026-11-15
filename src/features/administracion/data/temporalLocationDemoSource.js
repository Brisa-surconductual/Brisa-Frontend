import { TRACKING_ACCESS } from '../types/participantTracking.js';
import { TEMPORAL_DEMO_SCENARIO, getTemporalDemoScenario } from '../utils/temporalLocationDemoScenario.js';
import { applyIsolationScenario, begin } from './engagementDemoSource.js';
import { DEMO_TEMPORAL_LOCATION } from './temporalLocationDemoData.js';
import { resolveDemoParticipant } from './trackingDemoSource.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE LA CONSULTA TEMPORAL (M04, solo desarrollo).
 * Solo la carga temporalLocationSource.js mediante import() dinámico
 * cuando el modo demo está activo; en producción no llega al build.
 *
 * Consulta separada, con su propia autorización explícita simulada y
 * las mismas validaciones de cohorte, referencia y pertenencia que las
 * demás. La respuesta incluye a propósito campos que la interfaz debe
 * descartar (UUID, motivo de las pausas, fecha de inicio, correo).
 */
export async function getParticipantTemporalLocation(cohortId, reference) {
  const scenario = getTemporalDemoScenario();
  const catalog = TEMPORAL_DEMO_SCENARIO;

  await begin(scenario, catalog, 'M04 no disponible en la demostración.');

  const participantId = resolveDemoParticipant(cohortId, reference, { forceNotFound: scenario === catalog.NOT_FOUND });
  const stored = scenario === catalog.EMPTY ? null : DEMO_TEMPORAL_LOCATION[participantId] ?? null;
  const temporal = stored && {
    ...stored,
    pauses: stored.pauses?.map((item, index) => ({
      ...item,
      pauseId: `00000000-0000-4000-8000-00000000c00${index}`,
      reason: 'Motivo ficticio que nunca debe mostrarse.',
      registeredBy: 'admin.ficticio@example.com',
    })) ?? null,
    // Campos que la interfaz debe descartar.
    scheduleId: '00000000-0000-4000-8000-00000000c100',
    currentUnitId: '00000000-0000-4000-8000-00000000c101',
    programStartDate: '2026-01-26T00:00:00-05:00',
  };

  return applyIsolationScenario({
    access: TRACKING_ACCESS.GRANTED,
    cohortId,
    reference,
    temporal,
    participantId,
    email: 'participante.ficticio@example.com',
  }, scenario, catalog);
}
