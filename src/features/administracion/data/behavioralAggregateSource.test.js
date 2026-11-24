import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { interpretBehavioralAggregate } from '../services/behavioralAggregateResponse.js';
import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_SOURCE_MODE,
  AGGREGATE_VIEW_STATUS as S,
} from '../types/behavioralAggregate.js';
import { getAggregateDemoScenario } from '../utils/behavioralAggregateDemoScenario.js';
import { DEMO_AGGREGATE_DATA } from './behavioralAggregateDemoData.js';
import {
  getAggregateSourceMode,
  getBehavioralAggregate,
} from './behavioralAggregateSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';

const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: transport }));

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_AGGREGATE_SCENARIO', scenario);
}

const view = async (cohortId = 'demo-cohorte-b') =>
  interpretBehavioralAggregate(
    await getBehavioralAggregate(cohortId),
    cohortId,
  );

beforeEach(() => {
  resetDemoScenarios(vi);
  transport.get.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe('Puerto de la vista agregada en demostración (RF-132)', () => {
  it('modo demostración solo en desarrollo con la variable activa', () => {
    enableDemo();
    expect(getAggregateSourceMode()).toBe(AGGREGATE_SOURCE_MODE.DEMO);
  });

  it('datos disponibles: la vista de la cohorte pedida, sin campos individuales', async () => {
    enableDemo();
    const raw = await getBehavioralAggregate('demo-cohorte-b');
    expect(transport.get).not.toHaveBeenCalled();
    const result = interpretBehavioralAggregate(raw, 'demo-cohorte-b');

    // La fuente ficticia incluye campos individuales a propósito...
    expect(JSON.stringify(raw)).toContain('PART-0099');
    // ...y la interpretación los descarta.
    expect(result.status).toBe(S.READY);
    expect(result.data.activeUsers).toBe(
      DEMO_AGGREGATE_DATA['demo-cohorte-b'].total_usuarios_activos,
    );
    expect(JSON.stringify(result)).not.toMatch(/PART-|example\.com|id_usuario/);
  });

  it('cada cohorte recibe su propia vista: cambiar de cohorte no muestra datos de otra', async () => {
    enableDemo();
    const b = await view('demo-cohorte-b');
    const c = await view('demo-cohorte-c');

    expect(b.data.activeUsers).toBe(18);
    expect(c.data.activeUsers).toBe(11);
    expect(c.data.averageAdherence).not.toBe(b.data.averageAdherence);
    expect((await getBehavioralAggregate('demo-cohorte-c')).id_cohorte).toBe(
      'demo-cohorte-c',
    );
  });

  it('un cero real se conserva como cero', async () => {
    enableDemo();
    const a = await view('demo-cohorte-a');

    expect(a.data).toMatchObject({
      activeUsers: 0,
      averageAdherence: 0,
      pendingInactivityAlerts: 0,
    });
  });

  it.each([
    ['sin-consolidar', S.NOT_CONSOLIDATED],
    ['desactualizada', S.STALE],
    ['suprimido', S.SUPPRESSED],
    ['no-disponible', S.UNAVAILABLE],
  ])('escenario %s', async (scenario, status) => {
    enableDemo(scenario);
    const result = await view();

    expect(result.status).toBe(status);
    expect(result.data !== null).toBe(status === S.STALE);
  });

  it('desactualizada: entrega la última fecha disponible', async () => {
    enableDemo('desactualizada');
    const result = await view();

    expect(result.lastAvailableAt).toBe(
      DEMO_AGGREGATE_DATA['demo-cohorte-b'].fecha_actualizacion,
    );
  });

  it('suprimido: la fuente lo declara; no hay umbral ni cálculo en el frontend', async () => {
    enableDemo('suprimido');
    const raw = await getBehavioralAggregate('demo-cohorte-b');

    expect(raw).toMatchObject({
      estado: 'NO_DISPONIBLE',
      motivo_sin_datos: 'AGREGADO_SUPRIMIDO',
      datos: null,
    });
  });

  it('una cohorte inexistente se rechaza con código', async () => {
    enableDemo();
    await expect(getBehavioralAggregate('no-existe')).rejects.toMatchObject({
      code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
    });
  });

  it('error y carga', async () => {
    enableDemo('error');
    await expect(getBehavioralAggregate('demo-cohorte-b')).rejects.toThrow(
      'simulado',
    );

    vi.stubEnv('VITE_M08_AGGREGATE_SCENARIO', 'carga');
    const pending = getBehavioralAggregate('demo-cohorte-b');
    const settled = await Promise.race([
      pending.then(() => 'terminó'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);
    expect(settled).toBe('pendiente');
  });

  it('un escenario desconocido muestra datos disponibles', () => {
    expect(
      getAggregateDemoScenario({ VITE_M08_AGGREGATE_SCENARIO: 'otro' }),
    ).toBe('disponible');
  });
});
