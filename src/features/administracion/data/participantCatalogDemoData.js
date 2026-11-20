import {
  BASELINE_STATUS,
  CONSENT_STATUS,
  PARTICIPATION_STATUS,
  REGISTRATION_STATUS,
} from '../types/participantStatus.js';

/*
 * DATOS FICTICIOS DE DEMOSTRACIÓN (solo desarrollo, VITE_M08_DEMO).
 * Catálogo de participantes registrados que pueden proponerse para una
 * cohorte (RF-125). No es información real ni el contrato del backend.
 *
 * Además de los campos del participante (ver participantDemoData.js):
 *   demoResult       estado y motivos que la demostración DEVUELVE al
 *                    asignarlo. Es un resultado ficticio explícito: nadie
 *                    lo calcula a partir de registro, consentimiento o
 *                    línea base. En la integración lo decidirá el backend.
 *   demoAvailability opcional: 'NO_DISPONIBLE' (registrado, pero no se
 *                    puede asignar) o 'INEXISTENTE' (ya no existe: solo
 *                    aparece con un catálogo desactualizado).
 *
 * Los conflictos de «ya asignado» y «otra cohorte activa» no se fijan
 * aquí: surgen del estado en memoria tras cada asignación, y el
 * escenario `conflictos-asignacion` los prepara de antemano.
 */
export const DEMO_AVAILABILITY = Object.freeze({
  UNAVAILABLE: 'NO_DISPONIBLE',
  MISSING: 'INEXISTENTE',
});

function candidate(values) {
  return Object.freeze({
    ...values,
    demoResult: Object.freeze({
      ...values.demoResult,
      pendingReasons: Object.freeze(values.demoResult.pendingReasons ?? []),
    }),
  });
}

export const DEMO_PARTICIPANT_CATALOG = Object.freeze([
  candidate({
    id: 'demo-candidato-9',
    code: 'PART-0009',
    registrationStatus: REGISTRATION_STATUS.COMPLETE,
    consentStatus: CONSENT_STATUS.ACCEPTED,
    baselineStatus: BASELINE_STATUS.REGISTERED,
    demoResult: { participationStatus: PARTICIPATION_STATUS.ACTIVE },
  }),
  candidate({
    id: 'demo-candidato-10',
    code: 'PART-0010',
    registrationStatus: REGISTRATION_STATUS.COMPLETE,
    consentStatus: CONSENT_STATUS.ACCEPTED,
    baselineStatus: BASELINE_STATUS.NOT_REGISTERED,
    demoResult: {
      participationStatus: PARTICIPATION_STATUS.PENDING_VALIDATION,
      pendingReasons: ['Línea base no registrada.'],
    },
  }),
  candidate({
    id: 'demo-candidato-11',
    code: 'PART-0011',
    registrationStatus: REGISTRATION_STATUS.INCOMPLETE,
    consentStatus: CONSENT_STATUS.NOT_ACCEPTED,
    baselineStatus: BASELINE_STATUS.PENDING,
    demoResult: {
      participationStatus: PARTICIPATION_STATUS.PENDING_VALIDATION,
      pendingReasons: [
        'Registro incompleto.',
        'Consentimiento informado no aceptado.',
        'Línea base no registrada.',
      ],
    },
  }),
  candidate({
    id: 'demo-candidato-12',
    code: 'PART-0012',
    registrationStatus: REGISTRATION_STATUS.COMPLETE,
    consentStatus: CONSENT_STATUS.ACCEPTED,
    baselineStatus: BASELINE_STATUS.REGISTERED,
    demoResult: { participationStatus: PARTICIPATION_STATUS.ACTIVE },
  }),
  candidate({
    id: 'demo-candidato-13',
    code: 'PART-0013',
    registrationStatus: REGISTRATION_STATUS.PENDING,
    consentStatus: CONSENT_STATUS.PENDING,
    baselineStatus: BASELINE_STATUS.PENDING,
    demoAvailability: DEMO_AVAILABILITY.UNAVAILABLE,
    demoResult: { participationStatus: PARTICIPATION_STATUS.PENDING_VALIDATION },
  }),
  candidate({
    id: 'demo-candidato-14',
    code: 'PART-0014',
    registrationStatus: REGISTRATION_STATUS.COMPLETE,
    consentStatus: CONSENT_STATUS.ACCEPTED,
    baselineStatus: BASELINE_STATUS.REGISTERED,
    demoAvailability: DEMO_AVAILABILITY.MISSING,
    demoResult: { participationStatus: PARTICIPATION_STATUS.ACTIVE },
  }),
]);
