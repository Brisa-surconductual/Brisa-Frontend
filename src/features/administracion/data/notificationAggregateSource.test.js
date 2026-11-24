import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { interpretBehavioralAggregate } from '../services/behavioralAggregateResponse.js';
import { interpretNarrativeAggregate } from '../services/narrativeAggregateResponse.js';
import { interpretNotificationAggregate } from '../services/notificationAggregateResponse.js';
import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_SOURCE_MODE,
  AGGREGATE_VIEW_STATUS as S,
} from '../types/behavioralAggregate.js';
import { getNotificationAggregateDemoScenario } from '../utils/notificationAggregateDemoScenario.js';
import { getBehavioralAggregate } from './behavioralAggregateSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { getNarrativeAggregate } from './narrativeAggregateSource.js';
import {
  getNotificationAggregate,
  getNotificationAggregateSourceMode,
} from './notificationAggregateSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario)
    vi.stubEnv('VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO', scenario);
}

const view = async (cohortId = 'demo-cohorte-b') =>
  interpretNotificationAggregate(
    await getNotificationAggregate(cohortId),
    cohortId,
  );

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
  // La vista de notificaciones no hace peticiones HTTP ni contacta a M07.
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(xhrSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Puerto de la vista de notificaciones en demostración (RF-134)', () => {
  it('modo demostración solo en desarrollo con la variable activa', () => {
    enableDemo();
    expect(getNotificationAggregateSourceMode()).toBe(
      AGGREGATE_SOURCE_MODE.DEMO,
    );
  });

  it('disponible: datos de la cohorte pedida, distintos por cohorte', async () => {
    enableDemo();
    const b = await view('demo-cohorte-b');
    const c = await view('demo-cohorte-c');

    expect(b.status).toBe(S.READY);
    expect(b.data).toMatchObject({
      averageOpenRate: 0.5825,
      averageConversionRate: 0.3125,
      sentNotifications: 412,
    });
    expect(b.lastAvailableAt).toBe('2026-11-20T12:15:00Z');
    expect(c.data.sentNotifications).toBe(265);
    expect(c.data.averageOpenRate).not.toBe(b.data.averageOpenRate);
  });

  it('una cohorte sin envíos: totales en 0 y tasas null, como datos válidos', async () => {
    enableDemo();
    expect(await view('demo-cohorte-a')).toMatchObject({
      status: S.READY,
      data: {
        averageOpenRate: null,
        averageConversionRate: null,
        sentNotifications: 0,
        deliveredNotifications: 0,
        discardedNotifications: 0,
      },
    });
  });

  it('sin-envios: aplica a cualquier cohorte', async () => {
    enableDemo('sin-envios');
    const result = await view();

    expect(result.status).toBe(S.READY);
    expect(result.data.sentNotifications).toBe(0);
    expect(result.data.averageOpenRate).toBeNull();
  });

  it.each([
    ['sin-consolidar', S.NOT_CONSOLIDATED, 'PENDIENTE'],
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
    expect(result.lastAvailableAt).toBe('2026-11-20T12:15:00Z');
    expect(result.data.deliveredNotifications).toBe(398);
  });

  it('métricas no calculables: agregado disponible con el aviso de M07', async () => {
    enableDemo('metricas-no-calculables');
    const result = await view();

    expect(result.status).toBe(S.READY);
    expect(result.message).toMatch(/excluidos del promedio agregado/);
    expect(result.data.averageOpenRate).toBe(0.5825);
  });

  it('cohorte inexistente: rechazo con código', async () => {
    enableDemo();
    await expect(getNotificationAggregate('cohorte-x')).rejects.toMatchObject({
      code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
    });
  });

  it('error: la consulta falla; carga: no termina', async () => {
    enableDemo('error');
    await expect(getNotificationAggregate('demo-cohorte-b')).rejects.toThrow(
      'Error simulado',
    );

    vi.stubEnv('VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO', 'carga');
    const outcome = await Promise.race([
      getNotificationAggregate('demo-cohorte-b').then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 50)),
    ]);
    expect(outcome).toBe('pendiente');
  });

  it('un escenario desconocido muestra datos; no reutiliza el escenario individual de RF-131', () => {
    expect(
      getNotificationAggregateDemoScenario({
        VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO: 'otro',
      }),
    ).toBe('disponible');
    expect(
      getNotificationAggregateDemoScenario({
        VITE_M08_NOTIFICATIONS_SCENARIO: 'error',
      }),
    ).toBe('disponible');
  });
});

describe('Independencia de las tres vistas agregadas (RF-132, RF-133, RF-134)', () => {
  it('una falla simulada de M07 no impide la vista conductual ni la narrativa', async () => {
    enableDemo('error');

    const [notifications, behavioral, narrative] = await Promise.allSettled([
      getNotificationAggregate('demo-cohorte-b'),
      getBehavioralAggregate('demo-cohorte-b'),
      getNarrativeAggregate('demo-cohorte-b'),
    ]);

    expect(notifications.status).toBe('rejected');
    expect(
      interpretBehavioralAggregate(behavioral.value, 'demo-cohorte-b').status,
    ).toBe(S.READY);
    expect(
      interpretNarrativeAggregate(narrative.value, 'demo-cohorte-b').status,
    ).toBe(S.READY);
  });

  it('una falla conductual o narrativa no impide las notificaciones', async () => {
    enableDemo('disponible');
    vi.stubEnv('VITE_M08_AGGREGATE_SCENARIO', 'error');
    vi.stubEnv('VITE_M08_NARRATIVE_AGGREGATE_SCENARIO', 'error');

    await expect(getBehavioralAggregate('demo-cohorte-b')).rejects.toThrow();
    await expect(getNarrativeAggregate('demo-cohorte-b')).rejects.toThrow();
    expect((await view()).status).toBe(S.READY);
  });
});

/*
 * El mock no llega al build de producción: ningún módulo de la aplicación
 * lo importa de forma estática, y el único import() dinámico está en la
 * fachada, dentro de la condición DEV && VITE_M08_DEMO (que Vite elimina
 * en producción). El build se verifica además buscando los datos ficticios
 * en dist/.
 */
describe('Mock de notificaciones fuera del build de producción (RF-134)', () => {
  const FEATURE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
  const files = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(join(dir, entry.name))
        : /\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)
          ? [join(dir, entry.name)]
          : [],
    );
  const DEMO_MODULES =
    /notificationAggregateDemo(Source|Data)\.js|notificationAggregateDemoScenario\.js/;

  it('solo la fachada carga la demostración, con import() dinámico bajo la condición del M08', () => {
    const importers = files(FEATURE_DIR)
      .filter((file) => DEMO_MODULES.test(readFileSync(file, 'utf8')))
      .map((file) => relative(FEATURE_DIR, file).split(sep).join('/'))
      .sort();

    expect(importers).toEqual([
      'data/notificationAggregateDemoSource.js',
      'data/notificationAggregateSource.js',
    ]);

    const facade = readFileSync(
      join(FEATURE_DIR, 'data/notificationAggregateSource.js'),
      'utf8',
    );
    expect(facade).not.toMatch(/^import .*notificationAggregateDemo/m);
    expect(facade).toMatch(
      /if \(import\.meta\.env\.DEV && import\.meta\.env\.VITE_M08_DEMO === 'true'\) \{\s*const demo = await import\('\.\/notificationAggregateDemoSource\.js'\);/,
    );
  });
});
