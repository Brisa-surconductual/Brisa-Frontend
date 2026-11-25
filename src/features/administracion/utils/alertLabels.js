import {
  ALERT_RESOLUTION_STATUS,
  TRACKING_ALERT_SOURCE,
  TRACKING_ALERT_TYPE,
} from '../types/participantTracking.js';

/*
 * Etiquetas legibles de las alertas (RF-128, RF-129). El dominio conserva
 * los valores originales; un valor desconocido no se interpreta ni se
 * muestra crudo: solo se indica que no se reconoce.
 */
const TYPE_LABEL = Object.freeze({
  [TRACKING_ALERT_TYPE.HIGH_CRAVING]: 'Craving elevado',
  [TRACKING_ALERT_TYPE.INACTIVITY]: 'Inactividad',
});

const STATUS_LABEL = Object.freeze({
  [ALERT_RESOLUTION_STATUS.ACTIVE]: 'Activa',
  [ALERT_RESOLUTION_STATUS.IN_REVIEW]: 'En revisión',
  [ALERT_RESOLUTION_STATUS.RESOLVED]: 'Resuelta',
  [ALERT_RESOLUTION_STATUS.DISMISSED]: 'Descartada',
});

/*
 * La fuente llega como el identificador del requerimiento que generó la
 * alerta (RF-63, RF-68). Se conserva en los datos; en pantalla se muestra
 * qué la detectó. Un valor desconocido no se muestra crudo.
 */
const SOURCE_LABEL = Object.freeze({
  [TRACKING_ALERT_SOURCE.HIGH_CRAVING]: 'Detección de craving elevado',
  [TRACKING_ALERT_SOURCE.INACTIVITY]: 'Detección de inactividad',
});

export function alertTypeLabel(type) {
  if (TYPE_LABEL[type]) return TYPE_LABEL[type];

  return type ? 'Tipo no reconocido' : 'Tipo no disponible';
}

export function alertStatusLabel(status) {
  if (STATUS_LABEL[status]) return STATUS_LABEL[status];

  return status ? 'Estado no reconocido' : 'Estado no disponible';
}

export function alertSourceLabel(source) {
  if (SOURCE_LABEL[source]) return SOURCE_LABEL[source];

  return source ? 'Fuente no reconocida' : 'Fuente no disponible';
}
