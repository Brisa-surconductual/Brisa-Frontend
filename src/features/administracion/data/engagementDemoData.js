import { NOT_CALCULABLE } from '../types/participantTracking.js';

/*
 * PROGRESIÓN NARRATIVA Y NOTIFICACIONES FICTICIAS (solo desarrollo,
 * VITE_M08_DEMO). No son datos reales ni el contrato del backend.
 * Fijadas a mano, independientes de la elegibilidad (RF-125), de los
 * indicadores de M05 y de las alertas: no se deducen de ellos.
 *
 * Se indexan por el identificador interno de la demo, que NUNCA se
 * muestra; la ficha los consulta con la misma referencia opaca
 * (DEMO_TRACKING_REFERENCES).
 *
 * DEMO_NARRATIVE_PROGRESS (RF-130 / RF-116): nombres de fase, capítulo
 * y logros explícitamente ficticios. Un participante sin entrada no
 * tiene progresión (204). Incluye una fase sin capítulo, logros vacíos,
 * logros no disponibles y un logro sin nombre ni fecha válida.
 *
 * DEMO_NOTIFICATION_INTERACTION (RF-131 / RF-98): totales enteros y
 * tasas tal como las expondría M07 (proporciones de 0 a 1 en la demo;
 * la escala real está pendiente). Incluye ceros reales, métricas
 * NO_CALCULABLE, ausentes y valores inválidos. Un participante sin
 * entrada no tiene historial de interacción (204).
 */
const achievement = (name, unlockedAt = null) => Object.freeze({ name, unlockedAt });

const narrative = (activePhaseName, lastCompletedChapterName, achievements) => Object.freeze({
  activePhaseName,
  lastCompletedChapterName,
  achievements: achievements === null ? null : Object.freeze(achievements),
});

export const DEMO_NARRATIVE_PROGRESS = Object.freeze({
  'demo-participante-1': narrative('Fase ficticia 3 · Consolidación', 'Capítulo ficticio 3.2', [
    achievement('Logro ficticio: primera semana completada', '2026-02-08T20:10:00-05:00'),
    achievement('Logro ficticio: participación constante', '2026-02-21T19:45:00-05:00'),
    achievement('Logro ficticio: capítulo de reflexión', '2026-03-06T21:00:00-05:00'),
  ]),
  // Logros vacíos: aún no ha desbloqueado ninguno.
  'demo-participante-2': narrative('Fase ficticia 1 · Inicio', 'Capítulo ficticio 1.1', []),
  // Sin capítulo completado: no se inventa uno.
  'demo-participante-3': narrative('Fase ficticia 1 · Inicio', null, [
    achievement('Logro ficticio: perfil narrativo creado'),
  ]),
  'demo-participante-4': narrative('Fase ficticia 2 · Exploración', 'Capítulo ficticio 2.3', [
    achievement('Logro ficticio: primera semana completada', '2026-02-12T08:30:00-05:00'),
    achievement('Logro ficticio: capítulo de reflexión', '2026-03-01T18:20:00-05:00'),
  ]),
  // demo-participante-5: sin progresión narrativa (204 de RF-130).
  // Lista de logros no disponible (null): distinta de una lista vacía.
  'demo-participante-6': narrative('Fase ficticia 2 · Exploración', 'Capítulo ficticio 2.1', null),
  'demo-participante-7': narrative('Fase ficticia 4 · Cierre', 'Capítulo ficticio 4.4', [
    achievement('Logro ficticio: historia completada', '2025-11-27T17:00:00-05:00'),
  ]),
  // Fase ausente, logro sin nombre y fecha no interpretable.
  'demo-participante-8': narrative(null, 'Capítulo ficticio 3.1', [
    achievement(null, '2025-11-20T10:00:00-05:00'),
    achievement('Logro ficticio: racha de registros', '2025-11-21 09:00'),
  ]),
  'demo-candidato-9': narrative('Fase ficticia 1 · Inicio', null, []),
  'demo-candidato-10': narrative('Fase ficticia 2 · Exploración', 'Capítulo ficticio 2.2', [
    achievement('Logro ficticio: primera semana completada', '2026-02-20T07:00:00-05:00'),
  ]),
});

const metrics = (values) => Object.freeze(values);

export const DEMO_NOTIFICATION_INTERACTION = Object.freeze({
  'demo-participante-1': metrics({
    sent: 42, delivered: 40, opened: 31, dismissed: 6, sessionsFromNotification: 18,
    openRate: 0.775, conversionRate: 0.45, dismissalRate: 0.15,
  }),
  // Ceros reales: distintos de «no disponible» y de «no calculable».
  'demo-participante-2': metrics({
    sent: 12, delivered: 12, opened: 0, dismissed: 0, sessionsFromNotification: 0,
    openRate: 0, conversionRate: 0, dismissalRate: 0,
  }),
  // Respuesta parcial (200 de RF-131): algunas métricas no calculables o ausentes.
  'demo-participante-3': metrics({
    sent: 20, delivered: 18, opened: 9, dismissed: NOT_CALCULABLE, sessionsFromNotification: null,
    openRate: 0.5, conversionRate: NOT_CALCULABLE, dismissalRate: NOT_CALCULABLE,
  }),
  'demo-participante-4': metrics({
    sent: 35, delivered: 33, opened: 14, dismissed: 11, sessionsFromNotification: 7,
    openRate: 0.4242, conversionRate: NOT_CALCULABLE, dismissalRate: 0.3333,
  }),
  // demo-participante-5: sin historial de interacción (204 de RF-131).
  'demo-participante-6': metrics({
    sent: 28, delivered: 27, opened: 20, dismissed: 4, sessionsFromNotification: 12,
    openRate: 0.7407, conversionRate: 0.4444, dismissalRate: 0.1481,
  }),
  'demo-participante-7': metrics({
    sent: 50, delivered: 50, opened: 46, dismissed: 2, sessionsFromNotification: 30,
    openRate: 0.92, conversionRate: 0.6, dismissalRate: 0.04,
  }),
  // Valores inválidos: negativos, fraccionarios o de otro tipo son «no disponible».
  'demo-participante-8': metrics({
    sent: -3, delivered: 10.5, opened: '7', dismissed: 1, sessionsFromNotification: 2,
    openRate: 'alta', conversionRate: null, dismissalRate: 0.1,
  }),
  'demo-candidato-9': metrics({
    sent: 0, delivered: 0, opened: 0, dismissed: 0, sessionsFromNotification: 0,
    openRate: NOT_CALCULABLE, conversionRate: NOT_CALCULABLE, dismissalRate: NOT_CALCULABLE,
  }),
  'demo-candidato-10': metrics({
    sent: 30, delivered: 29, opened: 8, dismissed: 15, sessionsFromNotification: 3,
    openRate: 0.2759, conversionRate: 0.1034, dismissalRate: 0.5172,
  }),
});
