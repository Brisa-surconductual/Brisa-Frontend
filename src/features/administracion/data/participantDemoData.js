import {
  BASELINE_STATUS,
  CONSENT_STATUS,
  PARTICIPATION_STATUS,
  REGISTRATION_STATUS,
} from '../types/participantStatus.js';

/*
 * DATOS FICTICIOS DE DEMOSTRACIÓN (solo desarrollo, VITE_M08_DEMO).
 * No son contratos del backend ni información de estudiantes reales.
 *
 * Forma interna de un participante de cohorte en el frontend, a partir
 * de RF-125:
 *   id                 ← id_participante (solo para la lista; no se muestra)
 *   cohortId           ← id_cohorte
 *   code               ← código seudonimizado (PENDIENTE de contrato)
 *   participationStatus← estado_participante_cohorte
 *   registrationStatus ← estado_registro
 *   consentStatus      ← estado_consentimiento
 *   baselineStatus     ← estado_linea_base
 *   pendingReasons     ← motivos de validación pendiente, tal como
 *                        los informe la fuente (PENDIENTE de contrato)
 *
 * Los códigos PART-NNNN son solo ejemplos de presentación: no fijan el
 * formato real ni se derivan de ningún dato personal. El estado de
 * participación y los motivos son resultados ficticios explícitos;
 * nadie los calcula a partir de los demás campos.
 */
function participant(values) {
  return Object.freeze({ ...values, pendingReasons: Object.freeze(values.pendingReasons ?? []) });
}

const COMPLETE_CHECKS = Object.freeze({
  registrationStatus: REGISTRATION_STATUS.COMPLETE,
  consentStatus: CONSENT_STATUS.ACCEPTED,
  baselineStatus: BASELINE_STATUS.REGISTERED,
});

export const DEMO_PARTICIPANTS = Object.freeze([
  // Cohorte Piloto B (ACTIVA): los tres estados de participación.
  participant({
    id: 'demo-participante-1',
    cohortId: 'demo-cohorte-b',
    code: 'PART-0001',
    participationStatus: PARTICIPATION_STATUS.ACTIVE,
    ...COMPLETE_CHECKS,
  }),
  participant({
    id: 'demo-participante-2',
    cohortId: 'demo-cohorte-b',
    code: 'PART-0002',
    participationStatus: PARTICIPATION_STATUS.ACTIVE,
    ...COMPLETE_CHECKS,
  }),
  participant({
    id: 'demo-participante-3',
    cohortId: 'demo-cohorte-b',
    code: 'PART-0003',
    participationStatus: PARTICIPATION_STATUS.PENDING_VALIDATION,
    registrationStatus: REGISTRATION_STATUS.COMPLETE,
    consentStatus: CONSENT_STATUS.ACCEPTED,
    baselineStatus: BASELINE_STATUS.NOT_REGISTERED,
    pendingReasons: ['Línea base no registrada.'],
  }),
  participant({
    id: 'demo-participante-4',
    cohortId: 'demo-cohorte-b',
    code: 'PART-0004',
    participationStatus: PARTICIPATION_STATUS.PENDING_VALIDATION,
    registrationStatus: REGISTRATION_STATUS.INCOMPLETE,
    consentStatus: CONSENT_STATUS.NOT_ACCEPTED,
    baselineStatus: BASELINE_STATUS.PENDING,
    pendingReasons: [
      'Registro incompleto.',
      'Consentimiento informado no aceptado.',
      'Línea base no registrada.',
    ],
  }),
  // Pendiente sin motivos: la fuente no siempre los proporciona.
  participant({
    id: 'demo-participante-5',
    cohortId: 'demo-cohorte-b',
    code: 'PART-0005',
    participationStatus: PARTICIPATION_STATUS.PENDING_VALIDATION,
    registrationStatus: REGISTRATION_STATUS.PENDING,
    consentStatus: CONSENT_STATUS.PENDING,
    baselineStatus: BASELINE_STATUS.PENDING,
  }),
  participant({
    id: 'demo-participante-6',
    cohortId: 'demo-cohorte-b',
    code: 'PART-0006',
    participationStatus: PARTICIPATION_STATUS.INACTIVE,
    ...COMPLETE_CHECKS,
  }),
  // Cohorte Piloto C (INACTIVA): participantes inactivos.
  participant({
    id: 'demo-participante-7',
    cohortId: 'demo-cohorte-c',
    code: 'PART-0007',
    participationStatus: PARTICIPATION_STATUS.INACTIVE,
    ...COMPLETE_CHECKS,
  }),
  participant({
    id: 'demo-participante-8',
    cohortId: 'demo-cohorte-c',
    code: 'PART-0008',
    participationStatus: PARTICIPATION_STATUS.INACTIVE,
    ...COMPLETE_CHECKS,
  }),
  // Cohorte Piloto A (BORRADOR) no tiene participantes.
]);
