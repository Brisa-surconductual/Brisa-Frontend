import { NOT_CALCULABLE, TRACKING_ALERT_TYPE, TRACKING_TREND } from '../types/participantTracking.js';

/*
 * SEGUIMIENTO FICTICIO (solo desarrollo, VITE_M08_DEMO). No son datos
 * reales ni el contrato del backend. Fuente ÚNICA del listado (RF-142) y
 * de la ficha individual (RF-128): el listado deriva de aquí sus
 * indicadores y el número de alertas activas, así que no pueden
 * contradecirse.
 *
 * Ambos mapas se indexan por el identificador interno de la demo, que
 * solo sirve para cruzarlos con las asociaciones en memoria y NUNCA se
 * muestra ni viaja en la URL.
 *
 * DEMO_TRACKING_REFERENCES: referencia OPACA y sintética de cada
 * participante para su ficha. No se deriva del código, del identificador
 * ni de ningún dato personal; el formato real lo definirá el backend.
 *
 * DEMO_TRACKING_PROFILES: lo que M05 expondría (RF-77/RF-128), fijado a
 * mano e INDEPENDIENTE de la elegibilidad de RF-125:
 *   progress, adherence  valor principal (número), null si no llegó, o
 *                        NO_CALCULABLE;
 *   trend                tendencia de consumo (incluye a propósito un
 *                        valor fuera del enumerado de RF-128);
 *   activeAlerts         [{ type, generatedAt }];
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

const alert = (type, generatedAt) => Object.freeze({ type, generatedAt });

function profile(values) {
  return Object.freeze({ ...values, activeAlerts: Object.freeze(values.activeAlerts) });
}

export const DEMO_TRACKING_PROFILES = Object.freeze({
  'demo-participante-1': profile({
    progress: 82, adherence: 91, trend: TRACKING_TREND.REDUCTION,
    activeAlerts: [], updatedAt: '2026-03-09T06:00:00-05:00',
  }),
  'demo-participante-2': profile({
    progress: 46, adherence: 58, trend: TRACKING_TREND.STABLE,
    activeAlerts: [alert(TRACKING_ALERT_TYPE.INACTIVITY, '2026-03-08T07:30:00-05:00')],
    updatedAt: '2026-03-09T06:00:00-05:00',
  }),
  'demo-participante-3': profile({
    progress: 64, adherence: 73, trend: TRACKING_TREND.INCREASE,
    activeAlerts: [], updatedAt: '2026-03-08T06:00:00-05:00',
  }),
  'demo-participante-4': profile({
    progress: 21, adherence: 34, trend: TRACKING_TREND.NOT_CALCULATED,
    activeAlerts: [
      alert(TRACKING_ALERT_TYPE.HIGH_CRAVING, '2026-03-07T21:15:00-05:00'),
      alert(TRACKING_ALERT_TYPE.INACTIVITY, '2026-03-05T07:30:00-05:00'),
    ],
    updatedAt: '2026-03-09T06:00:00-05:00',
  }),
  // demo-participante-5: sin perfil (equivale al 204 de RF-128).
  'demo-participante-6': profile({
    progress: 55, adherence: 42, trend: TRACKING_TREND.REDUCTION,
    activeAlerts: [alert(TRACKING_ALERT_TYPE.HIGH_CRAVING, '2026-03-06T19:40:00-05:00')],
    updatedAt: '2026-03-09T06:00:00-05:00',
  }),
  'demo-participante-7': profile({
    progress: 100, adherence: 88, trend: TRACKING_TREND.STABLE,
    activeAlerts: [], updatedAt: '2025-11-28T06:00:00-05:00',
  }),
  'demo-participante-8': profile({
    progress: 93, adherence: NOT_CALCULABLE, trend: 'ESTABILIZACION',
    activeAlerts: [], updatedAt: '2025-11-28T06:00:00-05:00',
  }),
  'demo-candidato-9': profile({
    progress: 12, adherence: 65, trend: TRACKING_TREND.INCREASE,
    activeAlerts: [], updatedAt: '2026-03-02T06:00:00-05:00',
  }),
  'demo-candidato-10': profile({
    progress: 37, adherence: 27, trend: TRACKING_TREND.STABLE,
    activeAlerts: [
      alert(TRACKING_ALERT_TYPE.INACTIVITY, '2026-03-01T07:30:00-05:00'),
      alert(TRACKING_ALERT_TYPE.HIGH_CRAVING, '2026-02-27T22:05:00-05:00'),
      alert(TRACKING_ALERT_TYPE.HIGH_CRAVING, '2026-02-25T20:50:00-05:00'),
    ],
    updatedAt: '2026-03-02T06:00:00-05:00',
  }),
});
