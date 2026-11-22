import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { interpretBehavioralAggregate } from '../services/behavioralAggregateResponse.js';
import { interpretNotificationAggregate } from '../services/notificationAggregateResponse.js';
import { EXPORT_ERROR, EXPORT_SOURCE_MODE } from '../types/cohortExport.js';
import { parseCsv } from '../utils/csvTestParser.js';
import { getBehavioralAggregate } from './behavioralAggregateSource.js';
import {
  exportCohortIndicatorsCsv,
  getExportSourceMode,
} from './cohortExportSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { getNotificationAggregate } from './notificationAggregateSource.js';

// Tiempo real: las demostraciones se cargan con import() dinámico.
function enableDemo(scenarios = {}) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  for (const [name, value] of Object.entries(scenarios))
    vi.stubEnv(name, value);
}

const COHORT = 'demo-cohorte-b';
const csvOf = async (request) =>
  parseCsv((await exportCohortIndicatorsCsv(COHORT, request)).content);

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
  // La exportación no hace peticiones HTTP: ni al endpoint ni a M05/M07.
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(xhrSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Exportación CSV sin integración (RF-144)', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: integración pendiente y ningún CSV local', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    expect(getExportSourceMode()).toBe(EXPORT_SOURCE_MODE.PENDING_INTEGRATION);
    await expect(exportCohortIndicatorsCsv(COHORT)).rejects.toThrow(
      'no está integrada',
    );
  });
});

describe('Exportación CSV en demostración (RF-144)', () => {
  it('genera el archivo con nombre válido y una fila de indicadores', async () => {
    enableDemo();
    const file = await exportCohortIndicatorsCsv(COHORT);

    expect(file.fileName).toMatch(/^indicadores_cohorte_activa_\d{8}\.csv$/);
    expect(file.content.endsWith('\r\n')).toBe(true);
    expect(file.sizeBytes).toBe(new TextEncoder().encode(file.content).length);
    expect(file.simulatedAudit).toBe(true);
    expect(parseCsv(file.content)).toHaveLength(2);
  });

  it('los datos son los mismos que las vistas RF-132 y RF-134 muestran para la cohorte', async () => {
    enableDemo();
    const [, row] = await csvOf();
    const behavioral = interpretBehavioralAggregate(
      await getBehavioralAggregate(COHORT),
      COHORT,
    ).data;
    const notifications = interpretNotificationAggregate(
      await getNotificationAggregate(COHORT),
      COHORT,
    ).data;

    expect(row[0]).toBe('Cohorte Piloto B');
    expect(Number(row[3])).toBe(behavioral.activeUsers);
    expect(Number(row[8])).toBe(behavioral.averageAdherence);
    expect(Number(row[9])).toBe(behavioral.pendingInactivityAlerts);
    expect(Number(row[13])).toBe(notifications.averageOpenRate);
    expect(Number(row[17])).toBe(notifications.discardedNotifications);
  });

  it('sin PII: los campos individuales de los mocks no aparecen', async () => {
    enableDemo();
    const { content } = await exportCohortIndicatorsCsv(COHORT);

    expect(content).not.toMatch(
      /PART-|example\.com|0000000000|ficticio|historial/,
    );
  });

  it('notificaciones no disponibles: CSV con la conducta y notificaciones «No disponible»', async () => {
    enableDemo({ VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO: 'no-disponible' });
    const file = await exportCohortIndicatorsCsv(COHORT);
    const [, row] = parseCsv(file.content);

    expect(file.notificationsAvailable).toBe(false);
    expect(row[8]).toBe('0.7342');
    expect(row.slice(11)).toEqual([
      'NO_DISPONIBLE',
      ...Array(6).fill('No disponible'),
    ]);
  });

  it('notificaciones con error de consulta: tampoco bloquea la exportación', async () => {
    enableDemo({ VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO: 'error' });
    expect(
      (await exportCohortIndicatorsCsv(COHORT)).notificationsAvailable,
    ).toBe(false);
  });

  it('valores nulos de RF-134 (sin envíos): «No disponible» para tasas y 0 para totales', async () => {
    enableDemo({ VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO: 'sin-envios' });
    const [, row] = await csvOf();

    expect(row[13]).toBe('No disponible');
    expect(row[15]).toBe('0');
  });

  it('vista conductual desactualizada: se exporta indicándolo', async () => {
    enableDemo({ VITE_M08_AGGREGATE_SCENARIO: 'desactualizada' });
    const file = await exportCohortIndicatorsCsv(COHORT);

    expect(file.behavioralStale).toBe(true);
    expect(parseCsv(file.content)[1][1]).toBe('DESACTUALIZADA');
  });

  it.each([
    [
      'RF-132 sin consolidar',
      { VITE_M08_AGGREGATE_SCENARIO: 'sin-consolidar' },
      EXPORT_ERROR.NO_INDICATORS,
    ],
    [
      'RF-132 con error',
      { VITE_M08_AGGREGATE_SCENARIO: 'error' },
      EXPORT_ERROR.GENERATION_FAILED,
    ],
    [
      'sin permiso',
      { VITE_M08_EXPORT_SCENARIO: 'sin-permiso' },
      EXPORT_ERROR.FORBIDDEN,
    ],
    [
      'error de generación',
      { VITE_M08_EXPORT_SCENARIO: 'error-generacion' },
      EXPORT_ERROR.GENERATION_FAILED,
    ],
    [
      'bitácora simulada no disponible',
      { VITE_M08_EXPORT_SCENARIO: 'auditoria-falla' },
      EXPORT_ERROR.AUDIT_UNAVAILABLE,
    ],
  ])('%s: rechazo sin archivo', async (_, scenarios, code) => {
    enableDemo(scenarios);
    await expect(exportCohortIndicatorsCsv(COHORT)).rejects.toMatchObject({
      code,
    });
  });

  it.each([
    ['inactiva', 'demo-cohorte-c'],
    ['en borrador', 'demo-cohorte-a'],
    ['inexistente', 'cohorte-inexistente'],
  ])('cohorte %s: 422', async (_, cohortId) => {
    enableDemo();
    await expect(exportCohortIndicatorsCsv(cohortId)).rejects.toMatchObject({
      code: EXPORT_ERROR.COHORT_NOT_ACTIVE,
    });
  });

  it('FA4: pedir PII o campos extra no cambia el CSV sanitizado', async () => {
    enableDemo();
    const baseline = await csvOf();
    const manipulated = await csvOf({
      include_pii: true,
      columnas: ['correo'],
    });

    vi.stubEnv('VITE_M08_EXPORT_SCENARIO', 'intento-pii');
    const injected = await csvOf({ include_pii: true });

    expect(manipulated).toEqual(baseline);
    expect(injected).toEqual(baseline);
    expect(injected.flat().join(',')).not.toMatch(
      /PII|example\.com|\+57|0000000000ff/,
    );
  });
});

describe('Mock de exportación fuera del build de producción (RF-144)', () => {
  const FEATURE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
  const files = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(join(dir, entry.name))
        : /\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)
          ? [join(dir, entry.name)]
          : [],
    );

  it('solo la fachada carga la demostración, con import() dinámico', () => {
    const importers = files(FEATURE_DIR)
      .filter((file) =>
        /cohortExportDemoSource|cohortExportDemoScenario\.js/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map((file) => relative(FEATURE_DIR, file).split(sep).join('/'))
      .sort();

    expect(importers).toEqual([
      'data/cohortExportDemoSource.js',
      'data/cohortExportSource.js',
    ]);

    const facade = readFileSync(
      join(FEATURE_DIR, 'data/cohortExportSource.js'),
      'utf8',
    );
    expect(facade).not.toMatch(/^import .*cohortExportDemo/m);
    expect(facade).toMatch(
      /if \(!\(import\.meta\.env\.DEV && import\.meta\.env\.VITE_M08_DEMO === 'true'\)\) \{[\s\S]*?throw[\s\S]*?\}\s*return import\('\.\/cohortExportDemoSource\.js'\);/,
    );
  });
});
