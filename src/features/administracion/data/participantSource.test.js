import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COHORT_TRANSITION } from '../services/cohortTransitions.js';
import { DEMO_PARTICIPANTS } from './participantDemoData.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { changeCohortStatus, createCohort, listCohorts, updateCohort } from './cohortSource.js';
import { ASSIGNMENT_ERROR, ASSIGNMENT_ISSUE } from '../types/participantAssignment.js';
import {
  assignParticipants,
  listAvailableParticipants,
  listCohortParticipants,
  removeCohortParticipant,
} from './participantSource.js';
import { REMOVAL_ERROR } from '../types/participantRemoval.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_DEMO_SCENARIO', scenario);
}

const NEW_COHORT = Object.freeze({
  name: 'Cohorte temporal',
  startDate: '2026-08-03',
  endDate: '2026-11-27',
  scheduleId: 'demo-cronograma-3',
});

const codes = (participants) => participants.map(({ code }) => code);

// Activos adicionales de la Cohorte Piloto B (PART-0015 a PART-0030),
// alineados con los 18 activos de la vista agregada (RF-132).
const PILOT_B_EXTRA = Array.from(
  { length: 16 },
  (_, index) => `PART-${String(15 + index).padStart(4, '0')}`,
);

let fetchSpy;

beforeEach(() => {
  resetDemoSource();
  resetDemoScenarios(vi);
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  // Ninguna consulta de participantes del M08 hace peticiones HTTP.
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Fuente de participantes sin integración', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: rechaza la consulta y no devuelve datos ficticios', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    await expect(listCohortParticipants('demo-cohorte-b')).rejects.toThrow('no está integrada');
    await expect(listAvailableParticipants('demo-cohorte-b')).rejects.toThrow('no está integrada');
    await expect(assignParticipants('demo-cohorte-b', ['demo-candidato-9'])).rejects.toThrow('no está integrada');
    await expect(removeCohortParticipant('demo-cohorte-b', 'demo-participante-1')).rejects.toThrow('no está integrada');
  });
});

describe('Fuente de participantes en modo de demostración', () => {
  it('lista solo los participantes de la cohorte pedida', async () => {
    enableDemo();

    const participants = await listCohortParticipants('demo-cohorte-b');

    expect(codes(participants)).toEqual(['PART-0001', 'PART-0002', 'PART-0003', 'PART-0004', 'PART-0005', 'PART-0006', ...PILOT_B_EXTRA]);
    expect(participants.every(({ cohortId }) => cohortId === 'demo-cohorte-b')).toBe(true);
    expect(codes(await listCohortParticipants('demo-cohorte-c'))).toEqual(['PART-0007', 'PART-0008']);
  });

  it('una cohorte sin participantes devuelve una lista vacía', async () => {
    enableDemo();

    expect(await listCohortParticipants('demo-cohorte-a')).toEqual([]);
  });

  it('una cohorte inexistente devuelve null (no encontrada)', async () => {
    enableDemo();

    expect(await listCohortParticipants('no-existe')).toBeNull();
  });

  it('reconoce una cohorte creada temporalmente y no le genera participantes', async () => {
    enableDemo();
    const created = await createCohort(NEW_COHORT);

    expect(await listCohortParticipants(created.id)).toEqual([]);
    expect(DEMO_PARTICIPANTS.some(({ cohortId }) => cohortId === created.id)).toBe(false);
  });

  it('una cohorte editada o con su estado cambiado conserva sus participantes', async () => {
    enableDemo();
    await updateCohort('demo-cohorte-b', NEW_COHORT);
    await changeCohortStatus('demo-cohorte-b', COHORT_TRANSITION.INACTIVATE);

    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(22);
  });

  it('error-participantes: solo falla la consulta de participantes', async () => {
    enableDemo('error-participantes');

    await expect(listCohortParticipants('demo-cohorte-b')).rejects.toThrow('Error simulado');
    expect(await listCohorts()).toHaveLength(3);
  });

  it('carga-participantes: la consulta no termina', async () => {
    enableDemo('carga-participantes');
    const outcome = await Promise.race([
      listCohortParticipants('demo-cohorte-b').then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);

    expect(outcome).toBe('pendiente');
  });

  it('error general de la demostración: la consulta falla, sin datos de reemplazo', async () => {
    enableDemo('error');

    await expect(listCohortParticipants('demo-cohorte-b')).rejects.toThrow('Error simulado');
  });
});

describe('Asignación de participantes en modo de demostración (RF-125)', () => {
  const issueOf = async (cohortId, code) =>
    (await listAvailableParticipants(cohortId)).find((candidate) => candidate.code === code)?.issue;

  it('el catálogo muestra solo códigos y el issue que decide la fuente', async () => {
    enableDemo();
    const catalog = await listAvailableParticipants('demo-cohorte-a');

    // E7-R1: registro completo (iniciales y catálogo), sin el inexistente.
    expect(catalog.map(({ code }) => code)).toEqual([
      'PART-0001', 'PART-0002', 'PART-0003', 'PART-0004', 'PART-0005', 'PART-0006',
      ...PILOT_B_EXTRA,
      'PART-0007', 'PART-0008', 'PART-0009', 'PART-0010', 'PART-0011', 'PART-0012', 'PART-0013',
    ]);
    for (const candidate of catalog) expect(Object.keys(candidate).sort()).toEqual(['code', 'id', 'issue']);
    expect(await issueOf('demo-cohorte-a', 'PART-0013')).toBe(ASSIGNMENT_ISSUE.PARTICIPANT_UNAVAILABLE);
    expect(await listAvailableParticipants('no-existe')).toBeNull();
  });

  it('asigna con el estado informado y el participante aparece en la cohorte', async () => {
    enableDemo();
    const outcome = await assignParticipants('demo-cohorte-a', ['demo-candidato-9', 'demo-candidato-10']);

    expect(outcome.ok).toBe(true);
    expect(outcome.assigned.map(({ code, participationStatus }) => [code, participationStatus])).toEqual([
      ['PART-0009', 'ACTIVO'],
      ['PART-0010', 'PENDIENTE_VALIDACION'],
    ]);
    expect(outcome.assigned[1].pendingReasons).toEqual(['Línea base no registrada.']);
    expect(codes(await listCohortParticipants('demo-cohorte-a'))).toEqual(['PART-0009', 'PART-0010']);
  });

  it('tras asignar deja de estar disponible para una asignación incompatible', async () => {
    enableDemo();
    await assignParticipants('demo-cohorte-b', ['demo-candidato-12']);

    expect(await issueOf('demo-cohorte-b', 'PART-0012')).toBe(ASSIGNMENT_ISSUE.ALREADY_ASSIGNED);
    expect(await issueOf('demo-cohorte-a', 'PART-0012')).toBe(ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT);

    const again = await assignParticipants('demo-cohorte-b', ['demo-candidato-12']);
    expect(again).toMatchObject({ ok: false, error: ASSIGNMENT_ERROR.CONFLICT });
    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(23);
  });

  it('una cohorte creada temporalmente puede recibir participantes', async () => {
    enableDemo();
    const created = await createCohort(NEW_COHORT);

    expect((await assignParticipants(created.id, ['demo-candidato-11'])).ok).toBe(true);
    expect(codes(await listCohortParticipants(created.id))).toEqual(['PART-0011']);
  });

  it('cohorte inexistente y selección vacía se rechazan con su código', async () => {
    enableDemo();

    expect((await assignParticipants('no-existe', ['demo-candidato-9'])).error).toBe(ASSIGNMENT_ERROR.COHORT_NOT_FOUND);
    expect((await assignParticipants('demo-cohorte-a', [])).error).toBe(ASSIGNMENT_ERROR.EMPTY_SELECTION);
  });

  it('los cambios persisten al navegar y se pierden al recargar', async () => {
    enableDemo();
    await assignParticipants('demo-cohorte-a', ['demo-candidato-9']);

    expect(await listCohortParticipants('demo-cohorte-a')).toHaveLength(1);

    resetDemoSource();

    expect(await listCohortParticipants('demo-cohorte-a')).toEqual([]);
    expect(await issueOf('demo-cohorte-a', 'PART-0009')).toBeNull();
  });

  it('conflictos-asignacion: catálogo desactualizado y conflictos al confirmar, sin asignar ninguno', async () => {
    enableDemo('conflictos-asignacion');

    const catalog = await listAvailableParticipants('demo-cohorte-a');
    expect(catalog.every(({ issue }) => issue === null)).toBe(true);
    expect(catalog.map(({ code }) => code)).toContain('PART-0014');
    expect(codes(await listCohortParticipants('demo-cohorte-b'))).toContain('PART-0009');

    const outcome = await assignParticipants('demo-cohorte-a', [
      'demo-candidato-9',
      'demo-candidato-12',
      'demo-candidato-13',
      'demo-candidato-14',
    ]);
    expect(outcome.error).toBe(ASSIGNMENT_ERROR.CONFLICT);
    expect(outcome.issues.map(({ code, issue }) => [code, issue])).toEqual([
      ['PART-0009', ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT],
      ['PART-0013', ASSIGNMENT_ISSUE.PARTICIPANT_UNAVAILABLE],
      ['PART-0014', ASSIGNMENT_ISSUE.PARTICIPANT_NOT_FOUND],
    ]);
    expect(await listCohortParticipants('demo-cohorte-a')).toEqual([]);

    const sameCohort = await assignParticipants('demo-cohorte-b', ['demo-candidato-9']);
    expect(sameCohort.issues[0].issue).toBe(ASSIGNMENT_ISSUE.ALREADY_ASSIGNED);
  });

  it('error-guardado: la asignación falla sin cambiar la cohorte', async () => {
    enableDemo('error-guardado');

    await expect(assignParticipants('demo-cohorte-a', ['demo-candidato-9'])).rejects.toThrow('Error simulado');
    expect(await listCohortParticipants('demo-cohorte-a')).toEqual([]);
  });

  it('error-catalogo: solo falla la consulta de disponibles', async () => {
    enableDemo('error-catalogo');

    await expect(listAvailableParticipants('demo-cohorte-a')).rejects.toThrow('Error simulado');
    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(22);
  });
});

describe('Retiro de participantes en modo de demostración (RF-125)', () => {
  const issueOf = async (cohortId, code) =>
    (await listAvailableParticipants(cohortId)).find((candidate) => candidate.code === code)?.issue;

  it('retira solo esa asociación: los demás conservan sus estados', async () => {
    enableDemo();
    const before = await listCohortParticipants('demo-cohorte-b');
    const outcome = await removeCohortParticipant('demo-cohorte-b', 'demo-participante-3');

    expect(outcome).toMatchObject({ ok: true, removed: { code: 'PART-0003', cohortId: 'demo-cohorte-b' } });
    const after = await listCohortParticipants('demo-cohorte-b');
    expect(codes(after)).toEqual(['PART-0001', 'PART-0002', 'PART-0004', 'PART-0005', 'PART-0006', ...PILOT_B_EXTRA]);
    expect(after).toEqual(before.filter(({ code }) => code !== 'PART-0003'));
    expect(codes(await listCohortParticipants('demo-cohorte-c'))).toEqual(['PART-0007', 'PART-0008']);
    expect(DEMO_PARTICIPANTS[2].code).toBe('PART-0003');
  });

  it('junto con E6: retirar libera al participante en el catálogo y permite reasignarlo', async () => {
    enableDemo();
    await assignParticipants('demo-cohorte-b', ['demo-candidato-10']);
    expect(await issueOf('demo-cohorte-a', 'PART-0010')).toBe(ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT);

    expect((await removeCohortParticipant('demo-cohorte-b', 'demo-candidato-10')).ok).toBe(true);
    expect(await issueOf('demo-cohorte-a', 'PART-0010')).toBeNull();
    expect(await issueOf('demo-cohorte-b', 'PART-0010')).toBeNull();

    const reassigned = await assignParticipants('demo-cohorte-a', ['demo-candidato-10']);
    expect(reassigned.assigned[0]).toMatchObject({ code: 'PART-0010', participationStatus: 'PENDIENTE_VALIDACION' });
  });

  it('funciona con una cohorte creada temporalmente', async () => {
    enableDemo();
    const created = await createCohort(NEW_COHORT);
    await assignParticipants(created.id, ['demo-candidato-9']);

    expect((await removeCohortParticipant(created.id, 'demo-candidato-9')).ok).toBe(true);
    expect(await listCohortParticipants(created.id)).toEqual([]);
  });

  it('cohorte inexistente, participante inexistente y no asociado', async () => {
    enableDemo();

    expect((await removeCohortParticipant('no-existe', 'demo-participante-1')).error).toBe(REMOVAL_ERROR.COHORT_NOT_FOUND);
    expect((await removeCohortParticipant('demo-cohorte-b', 'no-existe')).error).toBe(REMOVAL_ERROR.PARTICIPANT_NOT_FOUND);
    expect((await removeCohortParticipant('demo-cohorte-a', 'demo-participante-1')).error).toBe(REMOVAL_ERROR.NOT_ASSOCIATED);
    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(22);
  });

  it('un retiro repetido no informa éxito ni cambia otros registros', async () => {
    enableDemo();
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-1');

    expect(await removeCohortParticipant('demo-cohorte-b', 'demo-participante-1')).toEqual({ ok: false, error: REMOVAL_ERROR.NOT_ASSOCIATED });
    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(21);
  });

  it('persiste al navegar y se restablece al recargar', async () => {
    enableDemo();
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-1');
    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(21);

    resetDemoSource();

    expect(codes(await listCohortParticipants('demo-cohorte-b'))).toContain('PART-0001');
  });

  it('error-guardado: el retiro falla sin cambios parciales', async () => {
    enableDemo('error-guardado');

    await expect(removeCohortParticipant('demo-cohorte-b', 'demo-participante-1')).rejects.toThrow('Error simulado');
    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(22);
  });

  it('retiro-desactualizado: la lista mostrada incluye a PART-0002, pero otra operación ya lo retiró', async () => {
    enableDemo('retiro-desactualizado');

    expect(codes(await listCohortParticipants('demo-cohorte-b'))).toContain('PART-0002');
    expect((await removeCohortParticipant('demo-cohorte-b', 'demo-participante-2')).error).toBe(REMOVAL_ERROR.NOT_ASSOCIATED);
    expect(codes(await listCohortParticipants('demo-cohorte-b'))).not.toContain('PART-0002');
    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(21);
  });
});

describe('E7-R1: participantes iniciales retirados vuelven al catálogo', () => {
  const issueOf = async (cohortId, code) =>
    (await listAvailableParticipants(cohortId)).find((candidate) => candidate.code === code)?.issue;

  it('mientras está asociado, el catálogo respeta los conflictos existentes', async () => {
    enableDemo();

    // B está ACTIVA: ya asignado en B, en otra cohorte activa para A.
    expect(await issueOf('demo-cohorte-b', 'PART-0003')).toBe(ASSIGNMENT_ISSUE.ALREADY_ASSIGNED);
    expect(await issueOf('demo-cohorte-a', 'PART-0003')).toBe(ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT);
    // C está INACTIVA: las reglas actuales no impiden asignarlo a otra.
    expect(await issueOf('demo-cohorte-a', 'PART-0007')).toBeNull();
    expect(await issueOf('demo-cohorte-c', 'PART-0007')).toBe(ASSIGNMENT_ISSUE.ALREADY_ASSIGNED);
  });

  it('retirar a PART-0003 de B lo vuelve disponible en B y en A, con su mismo código', async () => {
    enableDemo();
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-3');

    expect(await issueOf('demo-cohorte-b', 'PART-0003')).toBeNull();
    expect(await issueOf('demo-cohorte-a', 'PART-0003')).toBeNull();
    const entries = (await listAvailableParticipants('demo-cohorte-b')).filter(({ code }) => code === 'PART-0003');
    expect(entries).toEqual([{ id: 'demo-participante-3', code: 'PART-0003', issue: null }]);
  });

  it('reasignarlo a la misma cohorte conserva exactamente sus estados y motivos', async () => {
    enableDemo();
    const original = DEMO_PARTICIPANTS.find(({ code }) => code === 'PART-0004');
    await removeCohortParticipant('demo-cohorte-b', original.id);

    const outcome = await assignParticipants('demo-cohorte-b', [original.id]);

    expect(outcome.ok).toBe(true);
    expect(outcome.assigned[0]).toEqual(original);
    expect(outcome.assigned[0].pendingReasons).toEqual([
      'Registro incompleto.',
      'Consentimiento informado no aceptado.',
      'Línea base no registrada.',
    ]);
    expect(codes(await listCohortParticipants('demo-cohorte-b'))).toEqual([
      'PART-0001', 'PART-0002', 'PART-0003', 'PART-0005', 'PART-0006', ...PILOT_B_EXTRA, 'PART-0004',
    ]);
  });

  it('asignarlo a otra cohorte conserva sus estados y lo bloquea en la original activa', async () => {
    enableDemo();
    const original = DEMO_PARTICIPANTS.find(({ code }) => code === 'PART-0003');
    await removeCohortParticipant('demo-cohorte-b', original.id);

    const outcome = await assignParticipants('demo-cohorte-a', [original.id]);

    expect(outcome.assigned[0]).toEqual({ ...original, cohortId: 'demo-cohorte-a' });
    expect(codes(await listCohortParticipants('demo-cohorte-a'))).toEqual(['PART-0003']);
    expect(await issueOf('demo-cohorte-b', 'PART-0003')).toBeNull();

    // Al activarse A, B ya no puede recibirlo (otra cohorte activa).
    await changeCohortStatus('demo-cohorte-a', COHORT_TRANSITION.ACTIVATE);
    expect(await issueOf('demo-cohorte-b', 'PART-0003')).toBe(ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT);
    expect((await assignParticipants('demo-cohorte-b', [original.id])).error).toBe(ASSIGNMENT_ERROR.CONFLICT);
  });

  it('no duplica asociaciones ni registros en el catálogo', async () => {
    enableDemo();
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-3');
    await assignParticipants('demo-cohorte-b', ['demo-participante-3']);

    const again = await assignParticipants('demo-cohorte-b', ['demo-participante-3', 'demo-participante-3']);
    expect(again.issues).toEqual([{ participantId: 'demo-participante-3', code: 'PART-0003', issue: ASSIGNMENT_ISSUE.ALREADY_ASSIGNED }]);
    expect(codes(await listCohortParticipants('demo-cohorte-b')).filter((code) => code === 'PART-0003')).toHaveLength(1);

    const catalog = await listAvailableParticipants('demo-cohorte-b');
    expect(new Set(catalog.map(({ id }) => id)).size).toBe(catalog.length);
  });

  it('participantes de una cohorte inactiva pueden asignarse a otra sin perder su asociación original', async () => {
    enableDemo();
    const outcome = await assignParticipants('demo-cohorte-a', ['demo-participante-7']);

    expect(outcome.assigned[0]).toMatchObject({ code: 'PART-0007', cohortId: 'demo-cohorte-a', participationStatus: 'INACTIVO' });
    expect(codes(await listCohortParticipants('demo-cohorte-c'))).toEqual(['PART-0007', 'PART-0008']);
  });

  it('al recargar se restablecen las asociaciones iniciales', async () => {
    enableDemo();
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-3');
    await assignParticipants('demo-cohorte-a', ['demo-participante-3']);

    resetDemoSource();

    expect(codes(await listCohortParticipants('demo-cohorte-b'))).toContain('PART-0003');
    expect(await listCohortParticipants('demo-cohorte-a')).toEqual([]);
    expect(await issueOf('demo-cohorte-b', 'PART-0003')).toBe(ASSIGNMENT_ISSUE.ALREADY_ASSIGNED);
  });

  it('no modifica los datos ficticios iniciales', async () => {
    enableDemo();
    const snapshot = JSON.stringify(DEMO_PARTICIPANTS);
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-3');
    await assignParticipants('demo-cohorte-a', ['demo-participante-3']);

    expect(JSON.stringify(DEMO_PARTICIPANTS)).toBe(snapshot);
  });
});
