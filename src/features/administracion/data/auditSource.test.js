import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COHORT_TRANSITION } from '../services/cohortTransitions.js';
import { AUDIT_QUERY_ERROR, AUDIT_SOURCE_MODE } from '../types/auditSource.js';
import { DEMO_AUDIT_RECORDS } from './auditDemoData.js';
import { AUDIT_DEMO_DELAY_MS } from './auditDemoSource.js';
import { getAuditSourceMode, listAuditRecords } from './auditSource.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { changeCohortStatus, createCohort } from './cohortSource.js';
import { assignParticipants, removeCohortParticipant } from './participantSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_AUDIT_SCENARIO', scenario);
}

let fetchSpy;

beforeEach(() => {
  resetDemoSource();
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  // La consulta de auditoría no hace peticiones HTTP.
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Fuente de auditoría sin integración', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: integración pendiente y ningún registro ficticio', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    expect(getAuditSourceMode()).toBe(AUDIT_SOURCE_MODE.PENDING_INTEGRATION);
    await expect(listAuditRecords()).rejects.toThrow('no está integrada');
  });
});

describe('Fuente de auditoría en modo de demostración', () => {
  it('entrega los registros ficticios en su orden, tras la espera', async () => {
    enableDemo();
    const start = Date.now();

    expect(getAuditSourceMode()).toBe(AUDIT_SOURCE_MODE.DEMO);
    expect(await listAuditRecords()).toEqual(DEMO_AUDIT_RECORDS);
    expect(Date.now() - start).toBeGreaterThanOrEqual(AUDIT_DEMO_DELAY_MS - 20);
  });

  it('vacia: lista vacía', async () => {
    enableDemo('vacia');

    expect(await listAuditRecords()).toEqual([]);
  });

  it('error: rechaza sin registros de reemplazo ni código de acceso', async () => {
    enableDemo('error');

    const error = await listAuditRecords().catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBeUndefined();
  });

  it('denegada: rechaza con el código estructurado de acceso denegado (simulado)', async () => {
    enableDemo('denegada');

    const error = await listAuditRecords().catch((reason) => reason);
    expect(error.code).toBe(AUDIT_QUERY_ERROR.ACCESS_DENIED);
    expect(error.message).toContain('simulado');
  });

  it('carga: la consulta no termina', async () => {
    enableDemo('carga');
    const outcome = await Promise.race([
      listAuditRecords().then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);

    expect(outcome).toBe('pendiente');
  });

  it('los escenarios de cohortes no afectan la auditoría', async () => {
    enableDemo();
    vi.stubEnv('VITE_M08_DEMO_SCENARIO', 'error');

    expect(await listAuditRecords()).toEqual(DEMO_AUDIT_RECORDS);
  });

  it('las operaciones de cohortes y participantes no generan registros de auditoría', async () => {
    enableDemo();
    const created = await createCohort({ name: 'Cohorte X', startDate: '2026-08-03', endDate: '2026-11-27', scheduleId: 'demo-cronograma-3' });
    await changeCohortStatus('demo-cohorte-a', COHORT_TRANSITION.ACTIVATE);
    await assignParticipants(created.id, ['demo-candidato-9']);
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-1');

    expect(await listAuditRecords()).toEqual(DEMO_AUDIT_RECORDS);
  });
});
