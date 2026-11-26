import { TRACKING_CLIENT_ERROR, trackingError } from '../services/trackingErrors.js';
import {
  ALERT_RESOLUTION_STATUS,
  PROGRESS_LEVELS,
  READ_ONLY_MODE,
  TRACKING_ACCESS,
  TRACKING_ALERT_SOURCE,
  TRACKING_ALERT_TYPE,
  TRACKING_QUERY_ERROR,
} from '../types/participantTracking.js';
import { ALERT_HISTORY_DEMO_SCENARIO, getAlertHistoryDemoScenario } from '../utils/alertHistoryDemoScenario.js';
import { PROFILE_DEMO_SCENARIO, getProfileDemoScenario } from '../utils/profileDemoScenario.js';
import { TRACKING_DEMO_SCENARIO, getTrackingDemoScenario } from '../utils/trackingDemoScenario.js';
import { getDemoCohortMembers } from './cohortDemoSource.js';
import { applyDegradedScenario } from './degradedDemo.js';
import { DEMO_ALERT_HISTORY, DEMO_TRACKING_PROFILES, DEMO_TRACKING_REFERENCES } from './trackingDemoData.js';
import { applyTrackingQuery } from './trackingDemoQuery.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE SEGUIMIENTO (solo desarrollo). Solo la carga
 * trackingSource.js mediante import() dinámico cuando el modo demo está
 * activo; en producción este módulo no llega al build.
 *
 * El listado (RF-142) y la ficha (RF-128) responden con las MISMAS formas
 * del contrato real del backend y rechazan con { status, codigo }, para
 * que la interfaz tenga una sola canalización. Los datos son ficticios
 * (trackingDemoData.js) y no constituyen seguridad real: el 403 y las
 * demás negativas son simulaciones.
 *
 * Los perfiles ficticios guardan progreso y adherencia como números de 0
 * a 100; aquí se presentan como en el contrato: el nivel como categoría
 * (tramos de 25 puntos, una convención SOLO de esta demostración) y la
 * adherencia como fracción entre 0 y 1. `null` y NO_CALCULABLE llegan
 * como `null`.
 *
 * El historial de alertas (RF-129) conserva su forma provisional: no está
 * integrado. Las respuestas incluyen campos adicionales (identificador
 * interno, correo, textos ficticios) para comprobar que la interfaz los
 * descarta.
 */
export const TRACKING_DEMO_DELAY_MS = 400;

const pause = () => new Promise((resolve) => setTimeout(resolve, TRACKING_DEMO_DELAY_MS));

function codedError(code, message) {
  return Object.assign(new Error(message), { code });
}

// Un número de 0 a 100; null y NO_CALCULABLE no son números.
const numeric = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

// Convención de la demostración: tramos de 25 puntos.
function demoLevel(progress) {
  const value = numeric(progress);
  if (value === null) return null;

  return PROGRESS_LEVELS[Math.min(PROGRESS_LEVELS.length - 1, Math.floor(value / 25))];
}

function demoFraction(adherence) {
  const value = numeric(adherence);

  return value === null ? null : Math.round(value) / 100;
}

const demoAlertId = (participantId, index) =>
  `00000000-0000-4000-9000-${participantId.replace(/\D/g, '').padStart(8, '0')}${String(index).padStart(4, '0')}`;

// Fila del listado con la forma real, derivada del mismo perfil de la ficha.
function rowFor(member) {
  const profile = DEMO_TRACKING_PROFILES[member.id] ?? null;
  const active = profile?.activeAlerts ?? [];

  return {
    codigo_participante: member.code,
    nivel_progreso: demoLevel(profile?.progress),
    tasa_adherencia: demoFraction(profile?.adherence),
    alertas_activas: active.length,
    alertas_atendidas: 0,
    tipos_alerta_activa: [...new Set(active.map(({ type }) => type))],
    // Campos que la interfaz debe descartar.
    id_usuario: member.id,
    correo: 'participante.ficticio@example.com',
  };
}

export async function listCohortTracking(cohortId, query) {
  const scenario = getTrackingDemoScenario();

  if (scenario === TRACKING_DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await pause();

  if (scenario === TRACKING_DEMO_SCENARIO.ERROR) throw trackingError(500, 'ERROR_LISTADO_INDICADORES');
  if (scenario === TRACKING_DEMO_SCENARIO.DENIED) throw trackingError(403, 'ACCESO_DENEGADO');

  const members = getDemoCohortMembers(cohortId);

  if (!members) throw trackingError(404, 'COHORTE_NO_ENCONTRADA');

  if (members.length === 0) {
    return {
      items: [],
      total: 0,
      offset: query.offset,
      limit: query.limit,
      mensaje: 'No se encontraron participantes registrados para la cohorte seleccionada.',
    };
  }

  const { total, items } = applyTrackingQuery(members.map(rowFor), query);
  const page = { items, total, offset: query.offset, limit: query.limit };

  // Respuesta mezclada: un registro repetido. La interfaz no la presenta.
  if (
    (scenario === TRACKING_DEMO_SCENARIO.FOREIGN_RECORD || scenario === TRACKING_DEMO_SCENARIO.FOREIGN_RESPONSE) &&
    items.length > 0
  ) {
    return { ...page, items: [items[0], ...items].slice(0, query.limit), total: Math.max(total, 2) };
  }

  return page;
}

// Participante de la demo por su referencia ficticia o por su código.
function participantFor(reference, members = []) {
  return (
    Object.keys(DEMO_TRACKING_REFERENCES).find((id) => DEMO_TRACKING_REFERENCES[id] === reference) ??
    members.find(({ code }) => code === reference)?.id ??
    null
  );
}

/*
 * Validaciones comunes de una consulta individual de demostración de las
 * secciones de la ficha, en el orden del backend: cohorte existente,
 * participante existente y pertenencia actual. Acepta la referencia
 * ficticia o el código del participante. Devuelve el identificador
 * interno (que nunca sale de la demo) o rechaza con su código. Lo usan
 * engagementDemoSource y temporalLocationDemoSource.
 */
export function resolveDemoParticipant(cohortId, reference, { forceNotFound = false } = {}) {
  const members = getDemoCohortMembers(cohortId);

  if (!members) {
    throw codedError(TRACKING_QUERY_ERROR.COHORT_NOT_FOUND, 'Cohorte inexistente en la demostración.');
  }

  const participantId = participantFor(reference, members);

  if (!participantId || forceNotFound) {
    throw codedError(TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND, 'Referencia inexistente en la demostración.');
  }

  if (!members.some(({ id }) => id === participantId)) {
    throw codedError(TRACKING_QUERY_ERROR.OUTSIDE_COHORT, 'El participante no pertenece a la cohorte en la demostración.');
  }

  return participantId;
}

function profileBody(member, profile) {
  const level = demoLevel(profile.progress);
  const adherence = demoFraction(profile.adherence);

  return {
    codigo_participante: member.code,
    indicadores_adherencia: {
      tasa_adherencia: adherence,
      dias_con_registro: adherence === null ? null : Math.round(adherence * 25),
    },
    indicadores_progreso: {
      nivel_progreso: level,
      unidades_completadas: level === null ? null : (PROGRESS_LEVELS.indexOf(level) + 1) * 2,
    },
    tendencia_consumo: profile.trend,
    alertas_activas: (profile.activeAlerts ?? []).map((alert, index) => ({
      id_alerta: demoAlertId(member.id, index),
      tipo_alerta: alert.type,
      fecha_generacion: alert.generatedAt,
      estado_resolucion: ALERT_RESOLUTION_STATUS.ACTIVE,
      // Campo que la interfaz debe descartar.
      nivel_craving: 8,
    })),
    fecha_actualizacion: profile.updatedAt,
    modo_consulta: READ_ONLY_MODE,
    // Campos que la interfaz debe descartar.
    id_usuario: member.id,
    correo: 'participante.ficticio@example.com',
    texto_diario: 'Texto ficticio que nunca debe mostrarse.',
  };
}

/*
 * Ficha individual (RF-128) por código del participante. Valida en el
 * mismo orden que la fuente real: cohorte existente y pertenencia actual
 * (las membresías de la cohorte), luego el perfil. Devuelve el cuerpo del
 * contrato, null (204) o rechaza con { status, codigo }.
 */
export async function getParticipantTrackingProfile(cohortId, code) {
  const scenario = getProfileDemoScenario();

  if (scenario === PROFILE_DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await pause();

  if (scenario === PROFILE_DEMO_SCENARIO.ERROR) throw trackingError(500, 'ERROR_CONSULTA_SEGUIMIENTO');

  const members = getDemoCohortMembers(cohortId);

  if (!members) throw trackingError(404, 'COHORTE_NO_ENCONTRADA');

  const member = members.find((item) => item.code === code);

  if (!member || scenario === PROFILE_DEMO_SCENARIO.OUTSIDE_COHORT || scenario === PROFILE_DEMO_SCENARIO.OTHER_COHORT) {
    throw trackingError(null, TRACKING_CLIENT_ERROR.OUTSIDE_COHORT);
  }

  if (scenario === PROFILE_DEMO_SCENARIO.DENIED) throw trackingError(403, 'SIN_PERMISO_INDIVIDUAL');
  if (scenario === PROFILE_DEMO_SCENARIO.NOT_FOUND) throw trackingError(404, 'PARTICIPANTE_NO_ENCONTRADO');
  if (scenario === PROFILE_DEMO_SCENARIO.UNAVAILABLE) throw trackingError(503, 'M05_NO_DISPONIBLE');

  const profile = scenario === PROFILE_DEMO_SCENARIO.NO_PROFILE ? null : DEMO_TRACKING_PROFILES[member.id] ?? null;

  if (!profile) return null;

  const body = profileBody(member, profile);

  if (scenario === PROFILE_DEMO_SCENARIO.INCONSISTENT) return { ...body, codigo_participante: 'PART-9999' };

  return applyDegradedScenario(body, scenario);
}

// Alerta tal como la enviaría M05, con campos que la interfaz descarta.
function rawAlert(alert, reference, index) {
  return {
    ...alert,
    reference,
    alertId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    cravingLevel: 8,
    notes: 'Nota ficticia que nunca debe mostrarse.',
  };
}

/*
 * Historial de alertas (RF-129). Mismas validaciones y orden que la
 * ficha: cohorte existente, referencia existente y pertenencia actual.
 * Las alertas ACTIVA son las mismas que el perfil expone como activas.
 */
export async function getParticipantAlertHistory(cohortId, reference) {
  const scenario = getAlertHistoryDemoScenario();

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await pause();

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado al cargar el historial de alertas de demostración.');
  }

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.UNAVAILABLE) {
    throw codedError(TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE, 'Seguimiento no disponible en la demostración.');
  }

  const members = getDemoCohortMembers(cohortId);

  if (!members) {
    throw codedError(TRACKING_QUERY_ERROR.COHORT_NOT_FOUND, 'Cohorte inexistente en la demostración.');
  }

  const participantId = participantFor(reference, members);

  if (!participantId || scenario === ALERT_HISTORY_DEMO_SCENARIO.NOT_FOUND) {
    throw codedError(TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND, 'Referencia inexistente en la demostración.');
  }

  if (!members.some(({ id }) => id === participantId)) {
    throw codedError(TRACKING_QUERY_ERROR.OUTSIDE_COHORT, 'El participante no pertenece a la cohorte en la demostración.');
  }

  const stored = scenario === ALERT_HISTORY_DEMO_SCENARIO.EMPTY ? [] : DEMO_ALERT_HISTORY[participantId] ?? [];
  const alerts = stored.map((alert, index) => rawAlert(alert, reference, index));
  const response = {
    access: TRACKING_ACCESS.GRANTED,
    cohortId,
    reference,
    alerts,
    // Campos que la interfaz debe descartar.
    participantId,
    email: 'participante.ficticio@example.com',
  };

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.DENIED) {
    return { ...response, access: TRACKING_ACCESS.DENIED };
  }

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.OTHER_COHORT) {
    return { ...response, cohortId: 'otra-cohorte-ficticia' };
  }

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.OTHER_PARTICIPANT) {
    const foreign = rawAlert(
      { type: TRACKING_ALERT_TYPE.HIGH_CRAVING, source: TRACKING_ALERT_SOURCE.HIGH_CRAVING, generatedAt: '2026-03-04T20:00:00-05:00', status: ALERT_RESOLUTION_STATUS.ACTIVE, resolvedAt: null },
      'seg-otro000',
      alerts.length,
    );
    return { ...response, alerts: [...alerts, foreign] };
  }

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.OUT_OF_SYNC) {
    const extra = rawAlert(
      { type: TRACKING_ALERT_TYPE.INACTIVITY, source: TRACKING_ALERT_SOURCE.INACTIVITY, generatedAt: '2026-03-09T07:30:00-05:00', status: ALERT_RESOLUTION_STATUS.ACTIVE, resolvedAt: null },
      reference,
      alerts.length,
    );
    return { ...response, alerts: [...alerts, extra] };
  }

  return applyDegradedScenario(response, scenario);
}
