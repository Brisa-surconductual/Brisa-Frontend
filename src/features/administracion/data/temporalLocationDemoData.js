import { PAUSE_STATUS } from '../types/temporalLocation.js';

/*
 * UBICACIÓN TEMPORAL FICTICIA (solo desarrollo, VITE_M08_DEMO). No son
 * datos reales ni el contrato del backend: lo que M04 expondría según
 * RF-22 y RF-22B, fijado a mano. Independiente de la elegibilidad, del
 * seguimiento, de la gamificación y de las notificaciones.
 *
 * Se indexa por el identificador interno de la demo, que NUNCA se
 * muestra; la ficha la consulta con la referencia opaca. Un participante
 * sin entrada no tiene cronograma asignado (sin información). Incluye
 * pausas en los tres estados, un cronograma finalizado, valores
 * ausentes o inválidos y una pausa sin fechas confiables. No incluye el
 * motivo de las pausas.
 */
const pause = (status, startsAt, endsAt) => Object.freeze({ status, startsAt, endsAt });

const temporal = (currentUnitName, effectiveElapsedSeconds, programFinished, pauses) => Object.freeze({
  currentUnitName,
  effectiveElapsedSeconds,
  programFinished,
  pauses: pauses === null ? null : Object.freeze(pauses),
});

const DAY = 86400;
const HOUR = 3600;

export const DEMO_TEMPORAL_LOCATION = Object.freeze({
  'demo-participante-1': temporal('Unidad ficticia 5 · Semana 5', 33 * DAY + 4 * HOUR, false, []),
  'demo-participante-2': temporal('Unidad ficticia 4 · Semana 4', 26 * DAY, false, [
    pause(PAUSE_STATUS.FINISHED, '2026-02-10T00:00:00-05:00', '2026-02-14T23:59:00-05:00'),
  ]),
  'demo-participante-3': temporal('Unidad ficticia 5 · Semana 5', 31 * DAY + 12 * HOUR, false, []),
  // Pausas en los tres estados.
  'demo-participante-4': temporal('Unidad ficticia 3 · Semana 3', 18 * DAY + 6 * HOUR, false, [
    pause(PAUSE_STATUS.ACTIVE, '2026-03-06T00:00:00-05:00', '2026-03-13T23:59:00-05:00'),
    pause(PAUSE_STATUS.FINISHED, '2026-02-17T00:00:00-05:00', '2026-02-20T23:59:00-05:00'),
    pause(PAUSE_STATUS.CANCELLED, '2026-02-03T00:00:00-05:00', '2026-02-05T23:59:00-05:00'),
  ]),
  // demo-participante-5: sin cronograma asignado (sin información).
  'demo-participante-6': temporal('Unidad ficticia 5 · Semana 5', 34 * DAY + 2 * HOUR, false, null),
  // Cronograma finalizado.
  'demo-participante-7': temporal('Unidad ficticia 8 · Cierre', 56 * DAY, true, []),
  // Valores ausentes o inválidos y una pausa sin fechas confiables.
  'demo-participante-8': temporal(null, -5, 'no', [
    pause('SUSPENDIDA', '2025-11-10 08:00', null),
  ]),
  'demo-candidato-9': temporal('Unidad ficticia 1 · Semana 1', 3 * HOUR, false, []),
  'demo-candidato-10': temporal('Unidad ficticia 2 · Semana 2', 9 * DAY + 20 * HOUR, false, []),
});
