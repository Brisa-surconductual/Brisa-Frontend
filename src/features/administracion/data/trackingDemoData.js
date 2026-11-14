/*
 * INDICADORES FICTICIOS DE SEGUIMIENTO (solo desarrollo, VITE_M08_DEMO).
 * No son datos reales ni el contrato del backend.
 *
 * Simulan lo que M05 expondría por participante (RF-77): progreso y
 * adherencia en porcentaje y número de alertas activas. Se indexan por
 * el identificador interno del participante (solo para el cruce con las
 * asociaciones de la demo; nunca se muestra).
 *
 * Son valores fijados a mano, INDEPENDIENTES de los estados de
 * elegibilidad de RF-125: no se calculan ni se deducen de ellos. Un
 * participante sin entrada aquí aparece con sus indicadores «No
 * disponibles». `null` representa un indicador aún no calculado.
 */
export const DEMO_TRACKING_INDICATORS = Object.freeze({
  'demo-participante-1': Object.freeze({ progress: 82, adherence: 91, activeAlertCount: 0 }),
  'demo-participante-2': Object.freeze({ progress: 46, adherence: 58, activeAlertCount: 1 }),
  'demo-participante-3': Object.freeze({ progress: 64, adherence: 73, activeAlertCount: 0 }),
  'demo-participante-4': Object.freeze({ progress: 21, adherence: 34, activeAlertCount: 2 }),
  'demo-participante-5': Object.freeze({ progress: null, adherence: null, activeAlertCount: null }),
  'demo-participante-6': Object.freeze({ progress: 55, adherence: 42, activeAlertCount: 1 }),
  'demo-participante-7': Object.freeze({ progress: 100, adherence: 88, activeAlertCount: 0 }),
  'demo-participante-8': Object.freeze({ progress: 93, adherence: 79, activeAlertCount: 0 }),
  'demo-candidato-9': Object.freeze({ progress: 12, adherence: 65, activeAlertCount: 0 }),
  'demo-candidato-10': Object.freeze({ progress: 37, adherence: 27, activeAlertCount: 3 }),
});
