import { SECTION_OUTCOME, SECTION_STATUS } from '../types/participantEngagement.js';
import { TRACKING_ACCESS, TRACKING_QUERY_ERROR } from '../types/participantTracking.js';

/*
 * Reglas comunes de las secciones de la ficha que consultan otros
 * módulos (RF-130, RF-131). Puras.
 *
 * Cada sección tiene su PROPIA autorización explícita: ni el rol
 * ADMINISTRATIVO, ni el acceso a la ficha (RF-128), ni el de otra
 * sección la implican. Sin `access === AUTORIZADO` la sección se trata
 * como denegada y no conserva ningún dato. Si la respuesta declara otra
 * cohorte u otra referencia que las pedidas, se bloquea entera (409).
 */
export function checkSectionEnvelope(response, { cohortId, reference }) {
  if (!response || response.access !== TRACKING_ACCESS.GRANTED) return SECTION_OUTCOME.DENIED;

  if (response.cohortId !== cohortId || response.reference !== reference) return SECTION_OUTCOME.INCONSISTENT;

  return null;
}

export const textOrNull = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

const STATUS_BY_OUTCOME = Object.freeze({
  [SECTION_OUTCOME.OK]: SECTION_STATUS.READY,
  [SECTION_OUTCOME.EMPTY]: SECTION_STATUS.EMPTY,
  [SECTION_OUTCOME.DENIED]: SECTION_STATUS.DENIED,
  [SECTION_OUTCOME.INCONSISTENT]: SECTION_STATUS.INCONSISTENT,
  [SECTION_OUTCOME.MALFORMED]: SECTION_STATUS.ERROR,
});

const STATUS_BY_CODE = Object.freeze({
  [TRACKING_QUERY_ERROR.ACCESS_DENIED]: SECTION_STATUS.DENIED,
  [TRACKING_QUERY_ERROR.EXPLICIT_PERMISSION_REQUIRED]: SECTION_STATUS.PERMISSION_REQUIRED,
  [TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND]: SECTION_STATUS.NOT_FOUND,
  [TRACKING_QUERY_ERROR.COHORT_NOT_FOUND]: SECTION_STATUS.COHORT_NOT_FOUND,
  [TRACKING_QUERY_ERROR.OUTSIDE_COHORT]: SECTION_STATUS.OUTSIDE_COHORT,
  [TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE]: SECTION_STATUS.UNAVAILABLE,
});

// Situación de la sección; siempre por resultado o código, nunca por texto.
export const sectionStatusFromOutcome = (outcome) => STATUS_BY_OUTCOME[outcome] ?? SECTION_STATUS.ERROR;

export const sectionStatusFromError = (error) => STATUS_BY_CODE[error?.code] ?? SECTION_STATUS.ERROR;
