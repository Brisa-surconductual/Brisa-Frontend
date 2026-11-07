import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COHORT_TRANSITION } from '../services/cohortTransitions.js';
import { DEMO_PARTICIPANTS } from './participantDemoData.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { changeCohortStatus, createCohort, listCohorts, updateCohort } from './cohortSource.js';
import { listCohortParticipants } from './participantSource.js';

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

let fetchSpy;

beforeEach(() => {
  resetDemoSource();
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
  });
});

describe('Fuente de participantes en modo de demostración', () => {
  it('lista solo los participantes de la cohorte pedida', async () => {
    enableDemo();

    const participants = await listCohortParticipants('demo-cohorte-b');

    expect(codes(participants)).toEqual(['PART-0001', 'PART-0002', 'PART-0003', 'PART-0004', 'PART-0005', 'PART-0006']);
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

    expect(await listCohortParticipants('demo-cohorte-b')).toHaveLength(6);
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
