/**
 * Estado del contenido ya programado dentro de una unidad temporal.
 *
 * Son exactamente tres. El bloqueo NO es un estado de contenido: ocurre a
 * nivel de unidad temporal, con TEMPORAL_UNIT_STATUS.BLOQUEADA.
 */
export const SCHEDULED_CONTENT_STATUS = Object.freeze({
  PROGRAMADO: 'PROGRAMADO',
  ACTIVO: 'ACTIVO',
  COMPLETADO: 'COMPLETADO',
});

export const SCHEDULED_CONTENT_STATUS_LABEL = Object.freeze({
  [SCHEDULED_CONTENT_STATUS.PROGRAMADO]: 'Programado',
  [SCHEDULED_CONTENT_STATUS.ACTIVO]: 'Activo',
  [SCHEDULED_CONTENT_STATUS.COMPLETADO]: 'Completado',
});

export const SCHEDULED_CONTENT_STATUS_TONE = Object.freeze({
  [SCHEDULED_CONTENT_STATUS.PROGRAMADO]: 'neutral',
  [SCHEDULED_CONTENT_STATUS.ACTIVO]: 'brand',
  [SCHEDULED_CONTENT_STATUS.COMPLETADO]: 'success',
});

/** Tipo de contenido del catálogo. */
export const CONTENT_TYPE = Object.freeze({
  ACTIVIDAD: 'ACTIVIDAD',
  EVALUACION: 'EVALUACION',
  REFLEXION: 'REFLEXION',
  PSICOEDUCACION: 'PSICOEDUCACION',
  EJERCICIO: 'EJERCICIO',
  PENDIENTE: 'PENDIENTE',
});

export const CONTENT_TYPE_LABEL = Object.freeze({
  [CONTENT_TYPE.ACTIVIDAD]: 'Actividad',
  [CONTENT_TYPE.EVALUACION]: 'Evaluación',
  [CONTENT_TYPE.REFLEXION]: 'Reflexión',
  [CONTENT_TYPE.PSICOEDUCACION]: 'Psicoeducación',
  [CONTENT_TYPE.EJERCICIO]: 'Ejercicio',
  [CONTENT_TYPE.PENDIENTE]: 'Por definir',
});

export const CONTENT_TYPE_TONE = Object.freeze({
  [CONTENT_TYPE.ACTIVIDAD]: 'brand',
  [CONTENT_TYPE.EVALUACION]: 'info',
  [CONTENT_TYPE.REFLEXION]: 'success',
  [CONTENT_TYPE.PSICOEDUCACION]: 'warning',
  [CONTENT_TYPE.EJERCICIO]: 'danger',
  [CONTENT_TYPE.PENDIENTE]: 'neutral',
});
