import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COHORT_TRANSITION } from '../services/cohortTransitions.js';
import { AUDIT_QUERY_ERROR, AUDIT_SOURCE_MODE } from '../types/auditSource.js';
import { DEMO_AUDIT_RECORDS } from './auditDemoData.js';
import { AUDIT_DEMO_DELAY_MS } from './auditDemoSource.js';
import { getAuditSourceMode, listAuditRecords } from './auditSource.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { changeCohortStatus, createCohort } from './cohortSource.js';
import { assignParticipants, removeCohortParticipant } from './participantSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_AUDIT_SCENARIO', scenario);
}

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: api }));

beforeEach(() => {
  resetDemoSource();
  resetDemoScenarios(vi);
  api.get.mockReset();
});

afterEach(() => {
  if (getAuditSourceMode() === AUDIT_SOURCE_MODE.DEMO) expect(api.get).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});

describe('Fuente de auditoría conectada', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: usa la API y proyecta los campos permitidos', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    api.get.mockResolvedValue({
      data: {
        data: [{ id_auditoria: 'entrada', accion: 'ACCESO_MODULO', recurso_afectado: 'Bitácora',
          marca_temporal: '2026-11-23T12:00:00Z', estado_accion: 'EXITOSA', direccion_ip: '192.0.2.1', id_recurso: 'privado' }],
        meta: { hay_mas: true, siguiente_cursor: 'siguiente' },
      },
    });
    expect(getAuditSourceMode()).toBe(AUDIT_SOURCE_MODE.API);
    await expect(listAuditRecords({ cursor: 'actual' })).resolves.toEqual({
      records: [{ id: 'entrada', action: 'ACCESO_MODULO', resource: 'Bitácora',
        timestamp: '2026-11-23T12:00:00Z', status: 'EXITOSA' }],
      nextCursor: 'siguiente',
    });
    expect(api.get).toHaveBeenCalledWith('/administrativo/auditoria', {
      params: { antes_de: 'actual' },
      signal: undefined,
    });
  });
  it.each([[401, AUDIT_QUERY_ERROR.SESSION_EXPIRED], [403, AUDIT_QUERY_ERROR.ACCESS_DENIED], [500, 'ERROR_REGISTRO_AUDITORIA']])(
    'trata %i como un fallo estructurado sin recurrir a la demostración', async (status, code) => {
      api.get.mockRejectedValue({ response: { status, data: { codigo: 'ERROR_REGISTRO_AUDITORIA' } } });
      await expect(listAuditRecords()).rejects.toMatchObject({ code });
    },
  );

  it('rechaza un cursor que no avanza', async () => {
    api.get.mockResolvedValue({ data: { data: [], meta: { hay_mas: true, siguiente_cursor: 'actual' } } });
    await expect(listAuditRecords({ cursor: 'actual' })).rejects.toThrow('página inválida');
  });
});

describe('Fuente de auditoría en modo de demostración', () => {
  it('entrega los registros ficticios en su orden, tras la espera', async () => {
    enableDemo();
    const start = Date.now();

    expect(getAuditSourceMode()).toBe(AUDIT_SOURCE_MODE.DEMO);
    expect(await listAuditRecords()).toEqual({ records: DEMO_AUDIT_RECORDS, nextCursor: null });
    expect(Date.now() - start).toBeGreaterThanOrEqual(AUDIT_DEMO_DELAY_MS - 20);
  });

  it('vacia: lista vacía', async () => {
    enableDemo('vacia');

    expect(await listAuditRecords()).toEqual({ records: [], nextCursor: null });
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

    expect(await listAuditRecords()).toEqual({ records: DEMO_AUDIT_RECORDS, nextCursor: null });
  });

  it('las operaciones de cohortes y participantes no generan registros de auditoría', async () => {
    enableDemo();
    const created = await createCohort({ name: 'Cohorte X', startDate: '2026-08-03', endDate: '2026-11-27', scheduleId: 'demo-cronograma-3' });
    await changeCohortStatus('demo-cohorte-a', COHORT_TRANSITION.ACTIVATE);
    await assignParticipants(created.id, ['demo-candidato-9']);
    await removeCohortParticipant('demo-cohorte-b', 'demo-participante-1');

    expect(await listAuditRecords()).toEqual({ records: DEMO_AUDIT_RECORDS, nextCursor: null });
  });
});
