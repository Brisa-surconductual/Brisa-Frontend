import { describe, expect, it } from 'vitest';

import { ASSIGNMENT_ERROR, ASSIGNMENT_ISSUE } from '../types/participantAssignment.js';
import { REMOVAL_ERROR } from '../types/participantRemoval.js';
import { DEMO_AVAILABILITY } from './participantCatalogDemoData.js';
import { createParticipantStore } from './participantDemoStore.js';

/*
 * Conjunto arbitrario, distinto de los datos de demostración: el
 * almacén es genérico y su lógica no depende de PART-NNNN.
 */
const COHORTS = Object.freeze({
  'c-borrador': Object.freeze({ id: 'c-borrador', status: 'BORRADOR' }),
  'c-activa': Object.freeze({ id: 'c-activa', status: 'ACTIVA' }),
  'c-inactiva': Object.freeze({ id: 'c-inactiva', status: 'INACTIVA' }),
});
const findCohort = (id) => COHORTS[id] ?? null;

const result = (participationStatus, pendingReasons = []) => Object.freeze({ participationStatus, pendingReasons });

const CATALOG = Object.freeze([
  Object.freeze({ id: 'k-1', code: 'Z-1', registrationStatus: 'COMPLETO', consentStatus: 'ACEPTADO', baselineStatus: 'REGISTRADA', demoResult: result('ACTIVO') }),
  Object.freeze({ id: 'k-2', code: 'Z-2', registrationStatus: 'COMPLETO', consentStatus: 'ACEPTADO', baselineStatus: 'NO_REGISTRADA', demoResult: result('PENDIENTE_VALIDACION', ['Motivo A.']) }),
  Object.freeze({ id: 'k-3', code: 'Z-3', registrationStatus: 'PENDIENTE', consentStatus: 'PENDIENTE', baselineStatus: 'PENDIENTE', demoAvailability: DEMO_AVAILABILITY.UNAVAILABLE, demoResult: result('ACTIVO') }),
  Object.freeze({ id: 'k-4', code: 'Z-4', registrationStatus: 'COMPLETO', consentStatus: 'ACEPTADO', baselineStatus: 'REGISTRADA', demoAvailability: DEMO_AVAILABILITY.MISSING, demoResult: result('ACTIVO') }),
]);

const store = (participants = []) => createParticipantStore({ participants, catalog: CATALOG });
const issuesOf = (outcome) => outcome.issues.map(({ participantId, issue }) => [participantId, issue]);

describe('Catálogo de participantes disponibles', () => {
  it('lista código e issue decidido por el almacén, sin campos de estado ni del resultado', () => {
    const list = store().listCandidates('c-borrador', { findCohort });

    expect(list).toEqual([
      { id: 'k-1', code: 'Z-1', issue: null },
      { id: 'k-2', code: 'Z-2', issue: null },
      { id: 'k-3', code: 'Z-3', issue: ASSIGNMENT_ISSUE.PARTICIPANT_UNAVAILABLE },
    ]);
    expect(Object.isFrozen(list)).toBe(true);
  });

  it('un catálogo desactualizado lista a todos como disponibles, incluido el inexistente', () => {
    const list = store().listCandidates('c-borrador', { findCohort, stale: true });

    expect(list.map(({ id, issue }) => [id, issue])).toEqual([['k-1', null], ['k-2', null], ['k-3', null], ['k-4', null]]);
  });

  it('refleja las asignaciones: ya asignado aquí, en otra cohorte activa, o libre si la otra no está activa', () => {
    const demo = store();
    demo.assign('c-activa', ['k-1'], { findCohort });
    demo.assign('c-inactiva', ['k-2'], { findCohort });

    expect(demo.listCandidates('c-activa', { findCohort })[0].issue).toBe(ASSIGNMENT_ISSUE.ALREADY_ASSIGNED);
    expect(demo.listCandidates('c-borrador', { findCohort })[0].issue).toBe(ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT);
    expect(demo.listCandidates('c-borrador', { findCohort })[1].issue).toBeNull();
  });
});

describe('Asignación de participantes', () => {
  it('asigna con el resultado explícito del catálogo, sin recalcularlo', () => {
    const demo = store();
    const outcome = demo.assign('c-borrador', ['k-1', 'k-2'], { findCohort });

    expect(outcome.ok).toBe(true);
    expect(outcome.assigned).toEqual([
      { id: 'k-1', cohortId: 'c-borrador', code: 'Z-1', participationStatus: 'ACTIVO', registrationStatus: 'COMPLETO', consentStatus: 'ACEPTADO', baselineStatus: 'REGISTRADA', pendingReasons: [] },
      { id: 'k-2', cohortId: 'c-borrador', code: 'Z-2', participationStatus: 'PENDIENTE_VALIDACION', registrationStatus: 'COMPLETO', consentStatus: 'ACEPTADO', baselineStatus: 'NO_REGISTRADA', pendingReasons: ['Motivo A.'] },
    ]);
    expect(demo.listByCohort('c-borrador')).toEqual(outcome.assigned);
  });

  it('un resultado ACTIVO se respeta aunque los estados no estén completos (lo decide la fuente)', () => {
    const catalog = [{ ...CATALOG[2], demoAvailability: undefined }];
    const outcome = createParticipantStore({ catalog }).assign('c-borrador', ['k-3'], { findCohort });

    expect(outcome.assigned[0]).toMatchObject({ participationStatus: 'ACTIVO', registrationStatus: 'PENDIENTE' });
  });

  it('una selección vacía se rechaza con su código', () => {
    expect(store().assign('c-borrador', [], { findCohort })).toEqual({ ok: false, error: ASSIGNMENT_ERROR.EMPTY_SELECTION, issues: [] });
    expect(store().assign('c-borrador', null, { findCohort }).error).toBe(ASSIGNMENT_ERROR.EMPTY_SELECTION);
  });

  it('una cohorte inexistente se rechaza con su código', () => {
    expect(store().assign('no-existe', ['k-1'], { findCohort }).error).toBe(ASSIGNMENT_ERROR.COHORT_NOT_FOUND);
  });

  it('es atómica: con un conflicto no asigna a ninguno y devuelve todos los conflictos', () => {
    const demo = store();
    demo.assign('c-activa', ['k-1'], { findCohort });

    const outcome = demo.assign('c-borrador', ['k-1', 'k-2', 'k-3', 'k-4', 'k-x'], { findCohort });

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toBe(ASSIGNMENT_ERROR.CONFLICT);
    expect(issuesOf(outcome)).toEqual([
      ['k-1', ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT],
      ['k-3', ASSIGNMENT_ISSUE.PARTICIPANT_UNAVAILABLE],
      ['k-4', ASSIGNMENT_ISSUE.PARTICIPANT_NOT_FOUND],
      ['k-x', ASSIGNMENT_ISSUE.PARTICIPANT_NOT_FOUND],
    ]);
    expect(outcome.issues[0].code).toBe('Z-1');
    expect(outcome.issues[3].code).toBeNull();
    expect(demo.listByCohort('c-borrador')).toEqual([]);
  });

  it('una segunda asignación a la misma cohorte es un conflicto y no duplica', () => {
    const demo = store();
    demo.assign('c-borrador', ['k-1'], { findCohort });

    expect(issuesOf(demo.assign('c-borrador', ['k-1'], { findCohort }))).toEqual([['k-1', ASSIGNMENT_ISSUE.ALREADY_ASSIGNED]]);
    expect(demo.listByCohort('c-borrador')).toHaveLength(1);
  });

  it('ignora identificadores repetidos en la misma solicitud', () => {
    const demo = store();

    expect(demo.assign('c-borrador', ['k-1', 'k-1'], { findCohort }).assigned).toHaveLength(1);
  });

  it('no modifica los registros iniciales ni el catálogo', () => {
    const initial = Object.freeze([Object.freeze({ id: 'p-1', cohortId: 'c-activa', code: 'Y-1' })]);
    const demo = store(initial);
    demo.assign('c-borrador', ['k-1'], { findCohort });

    expect(initial).toHaveLength(1);
    expect(CATALOG).toHaveLength(4);
    expect(demo.listByCohort('c-activa')).toEqual(initial);
  });
});

describe('Retiro de participantes (semántica provisional)', () => {
  const INITIAL = Object.freeze([
    Object.freeze({ id: 'p-1', cohortId: 'c-activa', code: 'Y-1', participationStatus: 'ACTIVO' }),
    Object.freeze({ id: 'p-2', cohortId: 'c-activa', code: 'Y-2', participationStatus: 'PENDIENTE_VALIDACION' }),
    Object.freeze({ id: 'p-1', cohortId: 'c-inactiva', code: 'Y-1', participationStatus: 'INACTIVO' }),
  ]);

  it('elimina solo la asociación con esa cohorte y conserva a los demás y las otras cohortes', () => {
    const demo = store(INITIAL);
    const outcome = demo.remove('c-activa', 'p-1', { findCohort });

    expect(outcome).toEqual({ ok: true, removed: INITIAL[0] });
    expect(demo.listByCohort('c-activa')).toEqual([INITIAL[1]]);
    expect(demo.listByCohort('c-activa')[0]).toBe(INITIAL[1]);
    expect(demo.listByCohort('c-inactiva')).toEqual([INITIAL[2]]);
    expect(INITIAL).toHaveLength(3);
  });

  it('no cambia el estado a INACTIVO ni borra al participante: puede reasignarse si la fuente lo permite', () => {
    const demo = store();
    demo.assign('c-activa', ['k-1'], { findCohort });

    expect(demo.listCandidates('c-borrador', { findCohort })[0].issue).toBe(ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT);
    expect(demo.remove('c-activa', 'k-1', { findCohort }).ok).toBe(true);
    expect(demo.listCandidates('c-borrador', { findCohort })[0]).toEqual({ id: 'k-1', code: 'Z-1', issue: null });
    expect(demo.listCandidates('c-activa', { findCohort })[0].issue).toBeNull();
    expect(demo.assign('c-borrador', ['k-1'], { findCohort }).assigned[0].participationStatus).toBe('ACTIVO');
  });

  it('retiro repetido: no asociado, sin cambios ni éxito falso', () => {
    const demo = store(INITIAL);
    demo.remove('c-activa', 'p-1', { findCohort });

    expect(demo.remove('c-activa', 'p-1', { findCohort })).toEqual({ ok: false, error: REMOVAL_ERROR.NOT_ASSOCIATED });
    expect(demo.listByCohort('c-activa')).toHaveLength(1);
    expect(demo.listByCohort('c-inactiva')).toHaveLength(1);
  });

  it('participante existente que no pertenece a la cohorte: no asociado', () => {
    expect(store(INITIAL).remove('c-borrador', 'p-2', { findCohort }).error).toBe(REMOVAL_ERROR.NOT_ASSOCIATED);
    expect(store().remove('c-borrador', 'k-2', { findCohort }).error).toBe(REMOVAL_ERROR.NOT_ASSOCIATED);
  });

  it('cohorte inexistente y participante inexistente se rechazan con su código', () => {
    const demo = store(INITIAL);

    expect(demo.remove('no-existe', 'p-1', { findCohort }).error).toBe(REMOVAL_ERROR.COHORT_NOT_FOUND);
    expect(demo.remove('c-activa', 'no-existe', { findCohort }).error).toBe(REMOVAL_ERROR.PARTICIPANT_NOT_FOUND);
    expect(demo.remove('c-activa', 'k-4', { findCohort }).error).toBe(REMOVAL_ERROR.PARTICIPANT_NOT_FOUND);
    expect(demo.listByCohort('c-activa')).toHaveLength(2);
  });
});

describe('E7-R1: registro único de participantes (genérico)', () => {
  const INITIAL = Object.freeze([
    Object.freeze({ id: 'p-1', cohortId: 'c-activa', code: 'Y-1', participationStatus: 'PENDIENTE_VALIDACION', registrationStatus: 'COMPLETO', consentStatus: 'ACEPTADO', baselineStatus: 'NO_REGISTRADA', pendingReasons: Object.freeze(['Motivo Y.']) }),
    Object.freeze({ id: 'p-1', cohortId: 'c-inactiva', code: 'Y-1', participationStatus: 'INACTIVO', registrationStatus: 'COMPLETO', consentStatus: 'ACEPTADO', baselineStatus: 'NO_REGISTRADA', pendingReasons: Object.freeze([]) }),
  ]);

  it('el catálogo incluye a los asociados al inicio una sola vez, junto al catálogo', () => {
    const list = store(INITIAL).listCandidates('c-borrador', { findCohort });

    expect(list.map(({ id }) => id)).toEqual(['p-1', 'k-1', 'k-2', 'k-3']);
    expect(list[0]).toEqual({ id: 'p-1', code: 'Y-1', issue: ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT });
  });

  it('tras retirarlo se reasigna con el resultado de su primer registro, sin recalcular', () => {
    const demo = store(INITIAL);
    demo.remove('c-activa', 'p-1', { findCohort });

    expect(demo.listCandidates('c-activa', { findCohort })[0].issue).toBeNull();
    expect(demo.assign('c-activa', ['p-1'], { findCohort }).assigned[0]).toEqual(INITIAL[0]);
  });

  it('si un identificador está en ambos, manda el catálogo y no se duplica', () => {
    const catalog = [{ ...CATALOG[0], id: 'p-1', code: 'Y-1' }];
    const demo = createParticipantStore({ participants: INITIAL, catalog });

    expect(demo.listCandidates('c-borrador', { findCohort })).toHaveLength(1);
    demo.remove('c-activa', 'p-1', { findCohort });
    expect(demo.assign('c-borrador', ['p-1'], { findCohort }).assigned[0].participationStatus).toBe('ACTIVO');
  });
});
