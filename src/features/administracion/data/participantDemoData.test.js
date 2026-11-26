import { describe, expect, it } from 'vitest';

import { PARTICIPATION_STATUS } from '../types/participantStatus.js';
import { DEMO_COHORTS } from './cohortDemoData.js';
import { DEMO_PARTICIPANTS } from './participantDemoData.js';
import { createParticipantStore } from './participantDemoStore.js';

// Únicos campos del modelo interno: nada personal ni clínico.
const ALLOWED_FIELDS = [
  'baselineStatus',
  'code',
  'cohortId',
  'consentStatus',
  'id',
  'participationStatus',
  'pendingReasons',
  'registrationStatus',
];

describe('Participantes ficticios de demostración', () => {
  it('solo tienen los campos administrativos autorizados', () => {
    for (const participant of DEMO_PARTICIPANTS) {
      expect(Object.keys(participant).sort()).toEqual(ALLOWED_FIELDS);
    }
  });

  it('usan códigos de ejemplo únicos, sin correos ni nombres', () => {
    const codes = DEMO_PARTICIPANTS.map(({ code }) => code);

    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^PART-\d{4}$/);
    expect(JSON.stringify(DEMO_PARTICIPANTS)).not.toMatch(/@|correo|nombre|documento|consumo/i);
  });

  it('son inmutables y deterministas', () => {
    expect(Object.isFrozen(DEMO_PARTICIPANTS)).toBe(true);
    for (const participant of DEMO_PARTICIPANTS) {
      expect(Object.isFrozen(participant)).toBe(true);
      expect(Object.isFrozen(participant.pendingReasons)).toBe(true);
    }
  });

  it('cubren los tres estados, motivos presentes y ausentes, y una cohorte sin participantes', () => {
    const statuses = new Set(DEMO_PARTICIPANTS.map(({ participationStatus }) => participationStatus));
    const pending = DEMO_PARTICIPANTS.filter(
      ({ participationStatus }) => participationStatus === PARTICIPATION_STATUS.PENDING_VALIDATION,
    );

    expect([...statuses].sort()).toEqual(Object.values(PARTICIPATION_STATUS).sort());
    expect(pending.some(({ pendingReasons }) => pendingReasons.length > 0)).toBe(true);
    expect(pending.some(({ pendingReasons }) => pendingReasons.length === 0)).toBe(true);
    expect(DEMO_PARTICIPANTS.some(({ cohortId }) => cohortId === 'demo-cohorte-a')).toBe(false);
  });

  it('solo pertenecen a cohortes ficticias existentes', () => {
    const cohortIds = new Set(DEMO_COHORTS.map(({ id }) => id));

    for (const { cohortId } of DEMO_PARTICIPANTS) expect(cohortIds.has(cohortId)).toBe(true);
  });
});

describe('Almacén de participantes de demostración', () => {
  // Conjunto arbitrario, distinto de los datos de demostración.
  const PARTICIPANTS = Object.freeze([
    Object.freeze({ id: 'p-1', cohortId: 'c-1', code: 'X-1' }),
    Object.freeze({ id: 'p-2', cohortId: 'c-2', code: 'X-2' }),
    Object.freeze({ id: 'p-3', cohortId: 'c-1', code: 'X-3' }),
  ]);

  it('filtra por identificador de cohorte, conservando el orden', () => {
    const store = createParticipantStore({ participants: PARTICIPANTS });

    expect(store.listByCohort('c-1').map(({ id }) => id)).toEqual(['p-1', 'p-3']);
    expect(store.listByCohort('c-2').map(({ id }) => id)).toEqual(['p-2']);
  });

  it('una cohorte sin participantes devuelve una lista vacía, sin generar registros', () => {
    const store = createParticipantStore({ participants: PARTICIPANTS });

    expect(store.listByCohort('demo-temporal-1')).toEqual([]);
    expect(createParticipantStore().listByCohort('c-1')).toEqual([]);
  });

  it('devuelve listas inmutables y no modifica los registros recibidos', () => {
    const store = createParticipantStore({ participants: PARTICIPANTS });
    const list = store.listByCohort('c-1');

    expect(Object.isFrozen(list)).toBe(true);
    expect(list[0]).toBe(PARTICIPANTS[0]);
    expect(PARTICIPANTS).toHaveLength(3);
  });
});
