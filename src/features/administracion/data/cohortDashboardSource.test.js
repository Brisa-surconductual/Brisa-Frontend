import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findActiveCohort } from '../services/activeCohort.js';
import { COHORT_TRANSITION } from '../services/cohortTransitions.js';
import {
  assembleDashboard,
  loadDashboardSections,
  rememberValidSections,
} from '../services/cohortDashboard.js';
import { createDashboardCache } from '../services/dashboardCache.js';
import { AGGREGATE_VIEW_STATUS as S } from '../types/behavioralAggregate.js';
import {
  DASHBOARD_SECTION as SEC,
  PANEL_SOURCE,
  SECTION_OUTCOME as OUT,
} from '../types/cohortDashboard.js';
import { resetDashboardDemo } from './cohortDashboardDemoSource.js';
import { DASHBOARD_SOURCE } from './cohortDashboardSource.js';
import { changeCohortStatus } from './cohortSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';

const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: transport }));

/*
 * Panel principal (RF-140) con los mocks reales de RF-132, RF-133 y
 * RF-134 y la fuente de cohortes de demostración. Tiempo real: las
 * demostraciones se cargan con import() dinámico y tardan 400 ms.
 */
function enableDemo(scenarios = {}) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  for (const [name, value] of Object.entries(scenarios))
    vi.stubEnv(name, value);
}

const BEHAVIORAL = 'VITE_M08_AGGREGATE_SCENARIO';
const NARRATIVE = 'VITE_M08_NARRATIVE_AGGREGATE_SCENARIO';
const NOTIFICATIONS = 'VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO';

async function activeCohortId() {
  return findActiveCohort(await DASHBOARD_SOURCE.listCohorts()).cohort.id;
}

async function panel({ cache = createDashboardCache(), timeoutMs } = {}) {
  const cohortId = await activeCohortId();
  const loadedAt = new Date().toISOString();
  const results = await loadDashboardSections(
    cohortId,
    DASHBOARD_SOURCE.queries,
    timeoutMs,
  );
  rememberValidSections(cache, cohortId, results, loadedAt);
  return assembleDashboard({ cohortId, results, loadedAt, cache });
}

const outcomes = (dashboard) =>
  [SEC.BEHAVIORAL, SEC.NARRATIVE, SEC.NOTIFICATIONS].map(
    (section) => dashboard[section].outcome,
  );

let fetchSpy;
let xhrSpy;

beforeEach(() => {
  resetDemoScenarios(vi);
  resetDashboardDemo();
  transport.get.mockReset();
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  xhrSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('XMLHttpRequest', xhrSpy);
});

afterEach(() => {
  // Las peticiones de API se verifican a través del cliente HTTP simulado.
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(xhrSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Origen HTTP del panel principal (RF-140)', () => {
  it.each([
    [true, ''],
    [false, 'true'],
  ])('usa el contrato consolidado con DEV=%s y demo=%s', async (dev, demo) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', demo);
    const data = { estado: 'SIN_COHORTE_ACTIVA', id_cohorte: null };
    transport.get.mockResolvedValueOnce({ data });
    expect(DASHBOARD_SOURCE.isDemo()).toBe(false);
    await expect(DASHBOARD_SOURCE.getDashboard()).resolves.toBe(data);
    expect(transport.get).toHaveBeenCalledExactlyOnceWith('/admin/dashboard');
  });

  it.each(['DESACTUALIZADO', 'NO_DISPONIBLE'])(
    'conserva el cuerpo funcional del 503 %s',
    async (estado) => {
      const data = { codigo: 'FUENTES_DASHBOARD_NO_DISPONIBLES', estado };
      transport.get.mockRejectedValueOnce({ response: { status: 503, data } });
      await expect(DASHBOARD_SOURCE.getDashboard()).resolves.toBe(data);
    },
  );

  it('distingue un 503 genérico del contrato degradado del panel', async () => {
    transport.get.mockRejectedValueOnce({
      response: { status: 503, data: '<html>No disponible</html>' },
    });
    await expect(DASHBOARD_SOURCE.getDashboard()).rejects.toMatchObject({
      status: 503,
    });
  });
});

describe('Escenarios de demostración del panel (RF-140)', () => {
  it('identifica la cohorte ACTIVA de la demostración', async () => {
    enableDemo();
    expect(DASHBOARD_SOURCE.isDemo()).toBe(true);
    expect(await activeCohortId()).toBe('demo-cohorte-b');
  });

  it('las tres vistas disponibles, con el total de alertas de RF-132', async () => {
    enableDemo();
    const dashboard = await panel();

    expect(outcomes(dashboard)).toEqual([
      OUT.RESPONDED,
      OUT.RESPONDED,
      OUT.RESPONDED,
    ]);
    expect(dashboard.total_alertas_criticas_pendientes).toBe(3);
    expect(dashboard.origen_panel).toBe(PANEL_SOURCE.LIVE);
  });

  it.each([
    [
      'solo RF-132',
      { [BEHAVIORAL]: 'error' },
      [OUT.REJECTED, OUT.RESPONDED, OUT.RESPONDED],
    ],
    [
      'solo RF-133',
      { [NARRATIVE]: 'error' },
      [OUT.RESPONDED, OUT.REJECTED, OUT.RESPONDED],
    ],
    [
      'solo RF-134',
      { [NOTIFICATIONS]: 'error' },
      [OUT.RESPONDED, OUT.RESPONDED, OUT.REJECTED],
    ],
    [
      'RF-132 y RF-134',
      { [BEHAVIORAL]: 'error', [NOTIFICATIONS]: 'error' },
      [OUT.REJECTED, OUT.RESPONDED, OUT.REJECTED],
    ],
  ])(
    '%s fallando: las demás vistas no se afectan',
    async (_, scenarios, expected) => {
      enableDemo(scenarios);
      expect(outcomes(await panel())).toEqual(expected);
    },
  );

  it('con RF-132 fallando, el total de alertas no se muestra', async () => {
    enableDemo({ [BEHAVIORAL]: 'error' });
    expect((await panel()).total_alertas_criticas_pendientes).toBeNull();
  });

  it('las tres fallando sin caché: panel no disponible', async () => {
    enableDemo({
      [BEHAVIORAL]: 'error',
      [NARRATIVE]: 'error',
      [NOTIFICATIONS]: 'error',
    });

    expect((await panel()).origen_panel).toBe(PANEL_SOURCE.UNAVAILABLE);
  });

  it('caída tras la primera carga: se conserva la última versión válida', async () => {
    enableDemo({ VITE_M08_DASHBOARD_SCENARIO: 'caida-tras-carga' });
    const cache = createDashboardCache();

    const first = await panel({ cache });
    const second = await panel({ cache });

    expect(first.origen_panel).toBe(PANEL_SOURCE.LIVE);
    expect(second.origen_panel).toBe(PANEL_SOURCE.CACHED);
    expect(outcomes(second)).toEqual([OUT.CACHED, OUT.CACHED, OUT.CACHED]);
    expect(second.vista_conductual.view.status).toBe(S.STALE);
    expect(second.total_alertas_criticas_pendientes).toBe(3);
    expect(second.alertas_desactualizadas).toBe(true);
  });

  it('una fuente que excede su tiempo límite no bloquea las demás', async () => {
    enableDemo({ [NARRATIVE]: 'carga' });
    const dashboard = await panel({ timeoutMs: 700 });

    expect(outcomes(dashboard)).toEqual([
      OUT.RESPONDED,
      OUT.TIMEOUT,
      OUT.RESPONDED,
    ]);
  });

  it('datos desactualizados: la vista y el total lo indican', async () => {
    enableDemo({ [BEHAVIORAL]: 'desactualizada' });
    const dashboard = await panel();

    expect(dashboard.vista_conductual.view.status).toBe(S.STALE);
    expect(dashboard.total_alertas_criticas_pendientes).toBe(3);
    expect(dashboard.alertas_desactualizadas).toBe(true);
  });

  it('alertas no disponibles cuando RF-132 no tiene vista anterior', async () => {
    enableDemo({ [BEHAVIORAL]: 'no-disponible' });
    const dashboard = await panel();

    expect(dashboard.vista_conductual.view.status).toBe(S.UNAVAILABLE);
    expect(dashboard.total_alertas_criticas_pendientes).toBeNull();
  });

  it('alertas en cero: la Cohorte Piloto A (cero alertas en RF-132), si estuviera activa', async () => {
    enableDemo();
    const cache = createDashboardCache();
    const results = await loadDashboardSections(
      'demo-cohorte-a',
      DASHBOARD_SOURCE.queries,
    );
    const dashboard = assembleDashboard({
      cohortId: 'demo-cohorte-a',
      results,
      loadedAt: new Date().toISOString(),
      cache,
    });

    expect(dashboard.total_alertas_criticas_pendientes).toBe(0);
  });

  // Última prueba del bloque: modifica el almacén de cohortes en memoria.
  it('sin cohorte activa: al desactivar la Cohorte Piloto B no se elige otra', async () => {
    enableDemo();
    await changeCohortStatus('demo-cohorte-b', COHORT_TRANSITION.INACTIVATE);

    expect(findActiveCohort(await DASHBOARD_SOURCE.listCohorts()).result).toBe(
      'NONE',
    );
  });
});

/*
 * Los mocks del panel no llegan al build de producción: solo la fachada
 * carga la demostración del panel, con import() dinámico bajo la
 * condición DEV && VITE_M08_DEMO. Las vistas reutilizan las fachadas de
 * RF-132, RF-133 y RF-134, ya verificadas por sus propias pruebas.
 */
describe('Mocks del panel fuera del build de producción (RF-140)', () => {
  const FEATURE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
  const files = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(join(dir, entry.name))
        : /\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)
          ? [join(dir, entry.name)]
          : [],
    );

  it('solo la fachada carga la demostración del panel, con import() dinámico', () => {
    const importers = files(FEATURE_DIR)
      .filter((file) =>
        /cohortDashboardDemoSource|dashboardDemoScenario\.js/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map((file) => relative(FEATURE_DIR, file).split(sep).join('/'))
      .sort();

    expect(importers).toEqual([
      'data/cohortDashboardDemoSource.js',
      'data/cohortDashboardSource.js',
    ]);

    const facade = readFileSync(
      join(FEATURE_DIR, 'data/cohortDashboardSource.js'),
      'utf8',
    );
    expect(facade).not.toMatch(/^import .*cohortDashboardDemoSource/m);
    expect(facade).toMatch(
      /if \(!\(import\.meta\.env\.DEV && import\.meta\.env\.VITE_M08_DEMO === 'true'\)\) \{[\s\S]*?return null;[\s\S]*?\}\s*return import\('\.\/cohortDashboardDemoSource\.js'\);/,
    );
  });
});
