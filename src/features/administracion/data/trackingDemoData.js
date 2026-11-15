import {
  ALERT_RESOLUTION_STATUS,
  NOT_CALCULABLE,
  TRACKING_ALERT_SOURCE,
  TRACKING_ALERT_TYPE,
  TRACKING_TREND,
} from '../types/participantTracking.js';

/*
 * SEGUIMIENTO FICTICIO (solo desarrollo, VITE_M08_DEMO). No son datos
 * reales ni el contrato del backend. Fuente ÚNICA del listado (RF-142),
 * de la ficha individual (RF-128) y del historial de alertas (RF-129):
 * el listado deriva de aquí sus indicadores y el número de alertas
 * activas, y las alertas activas de cada perfil se derivan del
 * historial, así que no pueden contradecirse.
 *
 * Los mapas se indexan por el identificador interno de la demo, que
 * solo sirve para cruzarlos con las asociaciones en memoria y NUNCA se
 * muestra ni viaja en la URL.
 *
 * DEMO_TRACKING_REFERENCES: referencia OPACA y sintética de cada
 * participante para su ficha. No se deriva del código, del identificador
 * ni de ningún dato personal; el formato real lo definirá el backend.
 *
 * DEMO_ALERT_HISTORY: alertas ficticias que M05 expondría (RF-129),
 * fijadas a mano en un orden NO cronológico (la interfaz las ordena):
 *   type, source   tipo y requerimiento fuente (RF-63, RF-68);
 *   generatedAt    fecha de generación (ISO 8601 con zona);
 *   status         estado de resolución;
 *   resolvedAt     fecha de resolución o null.
 * Incluye a propósito una alerta resuelta sin fecha de resolución, un
 * tipo, una fuente y un estado desconocidos y fechas no interpretables.
 * No se derivan de la elegibilidad, el progreso ni la adherencia.
 *
 * DEMO_TRACKING_PROFILES: lo que M05 expondría (RF-77/RF-128), fijado a
 * mano e INDEPENDIENTE de la elegibilidad de RF-125:
 *   progress, adherence  valor principal (número), null si no llegó, o
 *                        NO_CALCULABLE;
 *   trend                tendencia de consumo (incluye a propósito un
 *                        valor fuera del enumerado de RF-128);
 *   activeAlerts         [{ type, generatedAt }] de las alertas ACTIVA
 *                        del historial;
 *   updatedAt            última actualización (ISO 8601 con zona).
 * Un participante sin perfil equivale al 204 de RF-128.
 */
export const DEMO_TRACKING_REFERENCES = Object.freeze({
  'demo-participante-1': 'seg-k7m2q9',
  'demo-participante-2': 'seg-p4x8w1',
  'demo-participante-3': 'seg-b9t3n6',
  'demo-participante-4': 'seg-r2h7c5',
  'demo-participante-5': 'seg-z6d1v8',
  'demo-participante-6': 'seg-f3s9j2',
  'demo-participante-7': 'seg-m8q4y7',
  'demo-participante-8': 'seg-w1c6g3',
  'demo-candidato-9': 'seg-e5n2u4',
  'demo-candidato-10': 'seg-h7r9a1',
  'demo-candidato-11': 'seg-t2v5k8',
  'demo-candidato-12': 'seg-y9b3m6',
  'demo-candidato-13': 'seg-q6f8d2',
});

const { ACTIVE, IN_REVIEW, RESOLVED, DISMISSED } = ALERT_RESOLUTION_STATUS;

const SOURCE_BY_TYPE = Object.freeze({
  [TRACKING_ALERT_TYPE.HIGH_CRAVING]: TRACKING_ALERT_SOURCE.HIGH_CRAVING,
  [TRACKING_ALERT_TYPE.INACTIVITY]: TRACKING_ALERT_SOURCE.INACTIVITY,
});

const craving = (generatedAt, status, resolvedAt = null) => Object.freeze({
  type: TRACKING_ALERT_TYPE.HIGH_CRAVING,
  source: SOURCE_BY_TYPE[TRACKING_ALERT_TYPE.HIGH_CRAVING],
  generatedAt,
  status,
  resolvedAt,
});

const inactivity = (generatedAt, status, resolvedAt = null) => Object.freeze({
  type: TRACKING_ALERT_TYPE.INACTIVITY,
  source: SOURCE_BY_TYPE[TRACKING_ALERT_TYPE.INACTIVITY],
  generatedAt,
  status,
  resolvedAt,
});

const history = (...alerts) => Object.freeze(alerts);

export const DEMO_ALERT_HISTORY = Object.freeze({
  // Sin alertas registradas (204 de RF-129).
  'demo-participante-1': history(),
  'demo-participante-2': history(
    inactivity('2026-03-08T07:30:00-05:00', ACTIVE),
    inactivity('2026-02-20T07:30:00-05:00', RESOLVED, '2026-02-21T10:00:00-05:00'),
  ),
  'demo-participante-3': history(
    inactivity('2026-02-15T07:30:00-05:00', DISMISSED, '2026-02-16T08:45:00-05:00'),
    craving('2026-02-28T22:10:00-05:00', RESOLVED, '2026-03-01T09:30:00-05:00'),
  ),
  // Los cuatro estados, varias fechas y una resuelta sin fecha de resolución.
  'demo-participante-4': history(
    craving('2026-03-07T21:15:00-05:00', ACTIVE),
    craving('2026-02-10T21:00:00-05:00', RESOLVED),
    inactivity('2026-03-05T07:30:00-05:00', ACTIVE),
    craving('2026-03-03T22:40:00-05:00', IN_REVIEW),
    craving('2026-02-18T23:05:00-05:00', DISMISSED, '2026-02-19T09:10:00-05:00'),
    inactivity('2026-02-24T07:30:00-05:00', RESOLVED, '2026-02-25T16:20:00-05:00'),
  ),
  // Sin perfil (204 de RF-128), pero con historial propio.
  'demo-participante-5': history(
    inactivity('2026-01-12T07:30:00-05:00', RESOLVED, '2026-01-13T11:00:00-05:00'),
  ),
  'demo-participante-6': history(
    craving('2026-02-22T20:15:00-05:00', RESOLVED, '2026-02-23T08:00:00-05:00'),
    craving('2026-03-06T19:40:00-05:00', ACTIVE),
  ),
  'demo-participante-7': history(),
  // Valores fuera de los enumerados y fechas no interpretables.
  'demo-participante-8': history(
    Object.freeze({ type: 'RECAIDA', source: 'RF-99', generatedAt: '2025-11-20T10:00:00-05:00', status: 'ARCHIVADA', resolvedAt: null }),
    inactivity('2025-11-15 08:00', RESOLVED, 'fecha-invalida'),
    craving('2025-11-02T21:30:00Z', DISMISSED, '2025-11-03T14:00:00Z'),
  ),
  'demo-candidato-9': history(),
  'demo-candidato-10': history(
    inactivity('2026-03-01T07:30:00-05:00', ACTIVE),
    craving('2026-02-27T22:05:00-05:00', ACTIVE),
    craving('2026-02-25T20:50:00-05:00', ACTIVE),
    inactivity('2026-02-12T07:30:00-05:00', IN_REVIEW),
  ),
});

// Alertas activas del perfil: las ACTIVA del historial, en su orden.
function activeAlertsOf(participantId) {
  return Object.freeze(
    (DEMO_ALERT_HISTORY[participantId] ?? [])
      .filter(({ status }) => status === ACTIVE)
      .map(({ type, generatedAt }) => Object.freeze({ type, generatedAt })),
  );
}

function profile(participantId, values) {
  return Object.freeze({ ...values, activeAlerts: activeAlertsOf(participantId) });
}

export const DEMO_TRACKING_PROFILES = Object.freeze({
  'demo-participante-1': profile('demo-participante-1', {
    progress: 82, adherence: 91, trend: TRACKING_TREND.REDUCTION, updatedAt: '2026-03-09T06:00:00-05:00',
  }),
  'demo-participante-2': profile('demo-participante-2', {
    progress: 46, adherence: 58, trend: TRACKING_TREND.STABLE, updatedAt: '2026-03-09T06:00:00-05:00',
  }),
  'demo-participante-3': profile('demo-participante-3', {
    progress: 64, adherence: 73, trend: TRACKING_TREND.INCREASE, updatedAt: '2026-03-08T06:00:00-05:00',
  }),
  'demo-participante-4': profile('demo-participante-4', {
    progress: 21, adherence: 34, trend: TRACKING_TREND.NOT_CALCULATED, updatedAt: '2026-03-09T06:00:00-05:00',
  }),
  // demo-participante-5: sin perfil (equivale al 204 de RF-128).
  'demo-participante-6': profile('demo-participante-6', {
    progress: 55, adherence: 42, trend: TRACKING_TREND.REDUCTION, updatedAt: '2026-03-09T06:00:00-05:00',
  }),
  'demo-participante-7': profile('demo-participante-7', {
    progress: 100, adherence: 88, trend: TRACKING_TREND.STABLE, updatedAt: '2025-11-28T06:00:00-05:00',
  }),
  'demo-participante-8': profile('demo-participante-8', {
    progress: 93, adherence: NOT_CALCULABLE, trend: 'ESTABILIZACION', updatedAt: '2025-11-28T06:00:00-05:00',
  }),
  'demo-candidato-9': profile('demo-candidato-9', {
    progress: 12, adherence: 65, trend: TRACKING_TREND.INCREASE, updatedAt: '2026-03-02T06:00:00-05:00',
  }),
  'demo-candidato-10': profile('demo-candidato-10', {
    progress: 37, adherence: 27, trend: TRACKING_TREND.STABLE, updatedAt: '2026-03-02T06:00:00-05:00',
  }),
});
