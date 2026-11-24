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

const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: transport }));

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
  transport.get.mockReset();
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  xhrSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('XMLHttpRequest', xhrSpy);
});

afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(xhrSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const ID = '3f6c2a1e-8b7d-4c53-9a21-5d0e7b9f4a10';
const FECHA = '2026-11-15T05:00:00.000Z';

const disponible = {
  id_cohorte: ID,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: FECHA,
  motivo_sin_datos: null,
  mensaje: null,
  datos: {
    total_usuarios_cohorte: 18,
    distribucion_por_fase_narrativa: [{ fase: 'INICIO', total: 6 }],
    total_logros_desbloqueados: 29,
  },
};
const degradada = {
  ...disponible,
  estado: 'DESACTUALIZADA',
  estado_agregacion: 'ERROR_ACTUALIZACION',
};
const responderError = (status, data) => ({ response: { status, data } });

describe('Fuente de RF-133 en backend', () => {
  it.each([
    ['desarrollo sin demo', true, ''],
    ['producción con la variable de demo', false, 'true'],
  ])('%s consulta el endpoint de la cohorte', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);
    transport.get.mockResolvedValueOnce({ data: disponible });

    expect(getNarrativeSourceMode()).toBe(AGGREGATE_SOURCE_MODE.API);
    expect(await view(ID)).toMatchObject({
      status: S.READY,
      data: { cohortUsers: 18, unlockedAchievements: 29 },
    });
    expect(transport.get).toHaveBeenCalledExactlyOnceWith(
      `/admin/cohortes/${ID}/vistas/narrativa`,
    );
  });

  it('interpreta el 503 con métricas de respaldo y su fecha', async () => {
    transport.get.mockRejectedValueOnce(responderError(503, degradada));

    expect(await view(ID)).toMatchObject({
      status: S.STALE,
      lastAvailableAt: FECHA,
      data: { cohortUsers: 18, unlockedAchievements: 29 },
    });
  });

  it('descarta una copia que corresponde a otra cohorte', async () => {
    transport.get.mockRejectedValueOnce(
      responderError(503, { ...degradada, id_cohorte: 'otra-cohorte' }),
    );

    expect(await view(ID)).toMatchObject({
      status: S.INCONSISTENT,
      data: null,
    });
  });

  it('conserva el mensaje del 404 para una cohorte no activa', async () => {
    const mensaje = 'No existe una cohorte activa disponible.';
    transport.get.mockRejectedValueOnce(
      responderError(404, { codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA', mensaje }),
    );

    await expect(getNarrativeAggregate(ID)).rejects.toMatchObject({
      code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
      mensaje,
    });
  });

  it('acepta una cohorte pendiente como estado funcional', async () => {
    transport.get.mockResolvedValueOnce({
      data: {
        ...disponible,
        estado: 'NO_DISPONIBLE',
        estado_agregacion: 'PENDIENTE',
        motivo_sin_datos: 'SIN_CONSOLIDAR',
        datos: null,
      },
    });

    expect(await view(ID)).toMatchObject({
      status: S.NOT_CONSOLIDATED,
      data: null,
    });
  });
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

    expect(transport.get).not.toHaveBeenCalled();
    expect(b.status).toBe(S.READY);
    expect(b.data.phaseDistribution.map(({ users }) => users)).toEqual([
      6, 9, 3,
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
