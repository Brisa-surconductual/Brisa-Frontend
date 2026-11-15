import {
  ALERT_RESOLUTION_STATUS,
  TRACKING_ALERT_SOURCE,
  TRACKING_ALERT_TYPE,
} from '../types/participantTracking.js';

/*
 * Etiquetas legibles de las alertas (RF-128, RF-129). El dominio conserva
 * los valores originales; un valor desconocido se muestra tal cual, sin
 * interpretarlo.
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

const KNOWN_SOURCES = Object.freeze(Object.values(TRACKING_ALERT_SOURCE));

export function alertTypeLabel(type) {
  if (TYPE_LABEL[type]) return TYPE_LABEL[type];

  return type ? `Tipo no reconocido: ${type}` : 'Tipo no disponible';
}

export function alertStatusLabel(status) {
  if (STATUS_LABEL[status]) return STATUS_LABEL[status];

  return status ? `Estado no reconocido: ${status}` : 'Estado no disponible';
}

export function alertSourceLabel(source) {
  if (KNOWN_SOURCES.includes(source)) return source;

  return source ? `Fuente no reconocida: ${source}` : 'Fuente no disponible';
}
