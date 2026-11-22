import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { interpretBehavioralAggregate } from '../services/behavioralAggregateResponse.js';
import { interpretNarrativeAggregate } from '../services/narrativeAggregateResponse.js';
import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_SOURCE_MODE,
  AGGREGATE_VIEW_STATUS as S,
} from '../types/behavioralAggregate.js';
import { getNarrativeAggregateDemoScenario } from '../utils/narrativeAggregateDemoScenario.js';
import { getBehavioralAggregate } from './behavioralAggregateSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import {
  getNarrativeAggregate,
  getNarrativeSourceMode,
} from './narrativeAggregateSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_NARRATIVE_AGGREGATE_SCENARIO', scenario);
}

const view = async (cohortId = 'demo-cohorte-b') =>
  interpretNarrativeAggregate(await getNarrativeAggregate(cohortId), cohortId);

let fetchSpy;
let xhrSpy;

beforeEach(() => {
  resetDemoScenarios(vi);
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  xhrSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('XMLHttpRequest', xhrSpy);
});

afterEach(() => {
  // La vista narrativa no hace peticiones HTTP ni contacta a M06.
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(xhrSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Puerto de la vista narrativa sin integración (RF-133)', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])(
    '%s: integración pendiente y ningún dato ficticio',
    async (_, dev, flag) => {
      vi.stubEnv('DEV', dev);
      vi.stubEnv('VITE_M08_DEMO', flag);

      expect(getNarrativeSourceMode()).toBe(
        AGGREGATE_SOURCE_MODE.PENDING_INTEGRATION,
      );
      await expect(getNarrativeAggregate('demo-cohorte-b')).rejects.toThrow(
        'no está integrada',
      );
    },
  );
});

describe('Puerto de la vista narrativa en demostración (RF-133)', () => {
  it('modo demostración solo en desarrollo con la variable activa', () => {
    enableDemo();
    expect(getNarrativeSourceMode()).toBe(AGGREGATE_SOURCE_MODE.DEMO);
  });

  it('disponible: datos de la cohorte pedida, distintos por cohorte', async () => {
    enableDemo();
    const b = await view('demo-cohorte-b');
    const c = await view('demo-cohorte-c');

    expect(b.status).toBe(S.READY);
    expect(b.data.phaseDistribution.map(({ users }) => users)).toEqual([
      4, 9, 3,
    ]);
    expect(b.lastAvailableAt).toBe('2026-11-20T11:30:00Z');
    expect(c.data.phaseDistribution.map(({ users }) => users)).toEqual([
      1, 4, 6,
    ]);
    expect(c.data.unlockedAchievements).not.toBe(b.data.unlockedAchievements);
  });

  it('una cohorte sin métricas narrativas es un estado funcional', async () => {
    enableDemo();
    expect(await view('demo-cohorte-a')).toMatchObject({
      status: S.NOT_CONSOLIDATED,
      aggregationState: 'ACTUALIZADO',
      data: null,
    });
  });

  it.each([
    ['sin-consolidar', S.NOT_CONSOLIDATED, 'PENDIENTE'],
    ['sin-metricas', S.NOT_CONSOLIDATED, 'ACTUALIZADO'],
    ['no-disponible', S.UNAVAILABLE, 'ERROR_ACTUALIZACION'],
  ])('%s: sin datos', async (scenario, status, aggregationState) => {
    enableDemo(scenario);
    expect(await view()).toMatchObject({
      status,
      aggregationState,
      data: null,
    });
  });

  it('desactualizada: última vista válida con su fecha', async () => {
    enableDemo('desactualizada');
    const result = await view();

    expect(result.status).toBe(S.STALE);
    expect(result.lastAvailableAt).toBe('2026-11-20T11:30:00Z');
    expect(result.data.completedProgramUsers).toBe(2);
  });

  it('usuarios excluidos: datos disponibles con el aviso de M06', async () => {
    enableDemo('usuarios-excluidos');
    const result = await view();

    expect(result.status).toBe(S.READY);
    expect(result.message).toMatch(/no cuentan con perfil narrativo activo/);
    expect(result.data.usersWithAchievements).toBe(13);
  });

  it('cohorte inexistente: rechazo con código', async () => {
    enableDemo();
    await expect(getNarrativeAggregate('cohorte-x')).rejects.toMatchObject({
      code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
    });
  });

  it('error: la consulta falla; carga: no termina', async () => {
    enableDemo('error');
    await expect(getNarrativeAggregate('demo-cohorte-b')).rejects.toThrow(
      'Error simulado',
    );

    vi.stubEnv('VITE_M08_NARRATIVE_AGGREGATE_SCENARIO', 'carga');
    const outcome = await Promise.race([
      getNarrativeAggregate('demo-cohorte-b').then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 50)),
    ]);
    expect(outcome).toBe('pendiente');
  });

  it('un escenario desconocido muestra datos; no reutiliza el escenario de RF-130', () => {
    expect(
      getNarrativeAggregateDemoScenario({
        VITE_M08_NARRATIVE_AGGREGATE_SCENARIO: 'otro',
      }),
    ).toBe('disponible');
    expect(
      getNarrativeAggregateDemoScenario({
        VITE_M08_NARRATIVE_SCENARIO: 'error',
      }),
    ).toBe('disponible');
  });
});

describe('Independencia de la vista conductual (RF-133 / RF-132)', () => {
  it('una falla simulada de M06 no impide la vista conductual', async () => {
    enableDemo('error');
    vi.stubEnv('VITE_M08_AGGREGATE_SCENARIO', 'disponible');

    const [narrative, behavioral] = await Promise.allSettled([
      getNarrativeAggregate('demo-cohorte-b'),
      getBehavioralAggregate('demo-cohorte-b'),
    ]);

    expect(narrative.status).toBe('rejected');
    expect(
      interpretBehavioralAggregate(behavioral.value, 'demo-cohorte-b').status,
    ).toBe(S.READY);
  });

  it('una falla de la vista conductual no impide la narrativa', async () => {
    enableDemo('disponible');
    vi.stubEnv('VITE_M08_AGGREGATE_SCENARIO', 'error');

    await expect(getBehavioralAggregate('demo-cohorte-b')).rejects.toThrow();
    expect((await view()).status).toBe(S.READY);
  });
});
