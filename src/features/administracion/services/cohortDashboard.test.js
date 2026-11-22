import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEMO_AGGREGATE_DATA } from '../data/behavioralAggregateDemoData.js';
import { AGGREGATE_VIEW_STATUS as S } from '../types/behavioralAggregate.js';
import {
  DASHBOARD_SECTION as SEC,
  PANEL_SOURCE,
  SECTION_OUTCOME as OUT,
  VIEW_AVAILABILITY as AV,
} from '../types/cohortDashboard.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';
import { findActiveCohort } from './activeCohort.js';
import {
  assembleDashboard,
  availabilityOf,
  criticalAlertsTotal,
  loadDashboardSection,
  loadDashboardSections,
  rememberValidSections,
  withTimeout,
} from './cohortDashboard.js';
import { createDashboardCache } from './dashboardCache.js';

const COHORT = 'demo-cohorte-b';

const envelope = (datos, changes = {}) => ({
  id_cohorte: COHORT,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: '2026-11-20T13:00:00Z',
  motivo_sin_datos: null,
  mensaje: null,
  datos,
  ...changes,
});

const BEHAVIORAL = envelope(DEMO_AGGREGATE_DATA[COHORT]);
const NARRATIVE = envelope({
  distribucion_por_fase_narrativa: [{ fase: 'INICIO', total: 4 }],
  total_logros_desbloqueados: 41,
});
const NOTIFICATIONS = envelope({
  tasa_apertura_promedio: 0.5,
  total_notificaciones_enviadas: 10,
});

const resolved = (value) => vi.fn().mockResolvedValue(value);
const failing = () => vi.fn().mockRejectedValue(new Error('caída'));
const never = () => vi.fn(() => new Promise(() => {}));

const queries = (changes = {}) => ({
  [SEC.BEHAVIORAL]: resolved(BEHAVIORAL),
  [SEC.NARRATIVE]: resolved(NARRATIVE),
  [SEC.NOTIFICATIONS]: resolved(NOTIFICATIONS),
  ...changes,
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Cohorte activa del panel (RF-140 / RF-124)', () => {
  const cohort = (id, status) => ({ id, name: id, status });

  it('identifica la única cohorte ACTIVA', () => {
    const found = findActiveCohort([
      cohort('a', COHORT_STATUS.DRAFT),
      cohort('b', COHORT_STATUS.ACTIVE),
      cohort('c', COHORT_STATUS.INACTIVE),
    ]);

    expect(found.result).toBe('FOUND');
    expect(found.cohort.id).toBe('b');
  });

  it('nunca usa una cohorte BORRADOR o INACTIVA para llenar el panel', () => {
    expect(
      findActiveCohort([
        cohort('a', COHORT_STATUS.DRAFT),
        cohort('c', COHORT_STATUS.INACTIVE),
      ]),
    ).toMatchObject({ result: 'NONE', cohort: null });
    expect(findActiveCohort(null).result).toBe('NONE');
  });

  it('con varias cohortes activas no elige ninguna', () => {
    const found = findActiveCohort([
      cohort('a', COHORT_STATUS.ACTIVE),
      cohort('b', COHORT_STATUS.ACTIVE),
    ]);

    expect(found.result).toBe('MULTIPLE');
    expect(found.cohort).toBeNull();
    expect(found.activeCohorts.map(({ id }) => id)).toEqual(['a', 'b']);
  });
});

describe('Consultas paralelas e independientes (RF-140)', () => {
  it('lanza las tres consultas a la vez, con Promise.allSettled', async () => {
    const allSettled = vi.spyOn(Promise, 'allSettled');
    const started = [];
    const pending = (section) =>
      vi.fn(() => {
        started.push(section);
        return new Promise((resolve) => setTimeout(resolve, 20, {}));
      });
    const load = loadDashboardSections(COHORT, {
      [SEC.BEHAVIORAL]: pending(SEC.BEHAVIORAL),
      [SEC.NARRATIVE]: pending(SEC.NARRATIVE),
      [SEC.NOTIFICATIONS]: pending(SEC.NOTIFICATIONS),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    // Las tres empezaron antes de que terminara ninguna.
    expect(started).toHaveLength(3);
    await load;
    expect(allSettled).toHaveBeenCalled();
  });

  it('consulta cada vista para la cohorte activa y la interpreta con su propio servicio', async () => {
    const q = queries();
    const results = await loadDashboardSections(COHORT, q);

    for (const section of Object.values(SEC)) {
      expect(q[section]).toHaveBeenCalledWith(COHORT);
      expect(results[section]).toMatchObject({
        section,
        outcome: OUT.RESPONDED,
        view: { status: S.READY },
      });
    }
    expect(results[SEC.BEHAVIORAL].view.data.activeUsers).toBe(18);
  });

  it('el rechazo de una fuente no cambia el estado de las otras', async () => {
    const results = await loadDashboardSections(
      COHORT,
      queries({ [SEC.NARRATIVE]: failing() }),
    );

    expect(results[SEC.NARRATIVE]).toMatchObject({
      outcome: OUT.REJECTED,
      view: { status: S.ERROR, data: null },
    });
    expect(results[SEC.BEHAVIORAL].outcome).toBe(OUT.RESPONDED);
    expect(results[SEC.NOTIFICATIONS].outcome).toBe(OUT.RESPONDED);
  });

  it('una fuente que falla de forma síncrona también queda aislada', async () => {
    const results = await loadDashboardSections(
      COHORT,
      queries({
        [SEC.BEHAVIORAL]: vi.fn(() => {
          throw new Error('síncrono');
        }),
      }),
    );

    expect(results[SEC.BEHAVIORAL].outcome).toBe(OUT.REJECTED);
    expect(results[SEC.NARRATIVE].outcome).toBe(OUT.RESPONDED);
  });

  it('cada fuente tiene su propio tiempo límite', async () => {
    vi.useFakeTimers();
    const load = loadDashboardSections(
      COHORT,
      queries({ [SEC.NOTIFICATIONS]: never() }),
      1000,
    );

    await vi.advanceTimersByTimeAsync(1000);
    const results = await load;

    expect(results[SEC.NOTIFICATIONS]).toMatchObject({
      outcome: OUT.TIMEOUT,
      view: { status: S.ERROR, data: null },
    });
    expect(results[SEC.BEHAVIORAL].outcome).toBe(OUT.RESPONDED);
  });

  it('withTimeout respeta la respuesta o el rechazo que llegan a tiempo', async () => {
    await expect(withTimeout(Promise.resolve(1), 50)).resolves.toBe(1);
    await expect(
      withTimeout(Promise.reject(new Error('x')), 50),
    ).rejects.toThrow('x');
  });

  it('reintenta una sola sección sin consultar las demás', async () => {
    const q = queries();
    const result = await loadDashboardSection(SEC.NARRATIVE, COHORT, q);

    expect(result.outcome).toBe(OUT.RESPONDED);
    expect(q[SEC.NARRATIVE]).toHaveBeenCalledTimes(1);
    expect(q[SEC.BEHAVIORAL]).not.toHaveBeenCalled();
    expect(q[SEC.NOTIFICATIONS]).not.toHaveBeenCalled();
  });

  it('una cohorte inexistente se distingue de una falla', async () => {
    const results = await loadDashboardSections(
      COHORT,
      queries({
        [SEC.BEHAVIORAL]: vi
          .fn()
          .mockRejectedValue({ code: 'COHORT_NOT_FOUND' }),
      }),
    );

    expect(results[SEC.BEHAVIORAL].view.status).toBe(S.NOT_FOUND);
  });

  it('estado de disponibilidad por vista', async () => {
    const results = await loadDashboardSections(
      COHORT,
      queries({
        [SEC.BEHAVIORAL]: resolved({ ...BEHAVIORAL, estado: 'DESACTUALIZADA' }),
        [SEC.NARRATIVE]: resolved({
          ...NARRATIVE,
          datos: null,
          motivo_sin_datos: 'SIN_CONSOLIDAR',
        }),
        [SEC.NOTIFICATIONS]: resolved({
          ...NOTIFICATIONS,
          estado: 'NO_DISPONIBLE',
          datos: null,
        }),
      }),
    );

    expect(availabilityOf(results[SEC.BEHAVIORAL])).toBe(AV.STALE);
    expect(availabilityOf(results[SEC.NARRATIVE])).toBe(AV.AVAILABLE);
    expect(availabilityOf(results[SEC.NOTIFICATIONS])).toBe(AV.NOT_AVAILABLE);
    expect(
      availabilityOf({ outcome: OUT.TIMEOUT, view: { status: S.ERROR } }),
    ).toBe(AV.NOT_AVAILABLE);
  });
});

describe('Total de alertas críticas (única cifra calculada por RF-140)', () => {
  const view = (status, data) => ({ status, data });

  it('suma inactividad y craving de la vista conductual', () => {
    expect(
      criticalAlertsTotal(
        view(S.READY, { pendingInactivityAlerts: 2, pendingCravingAlerts: 1 }),
      ),
    ).toEqual({ total: 3, isStale: false });
  });

  it('ambas en cero: total cero', () => {
    expect(
      criticalAlertsTotal(
        view(S.READY, { pendingInactivityAlerts: 0, pendingCravingAlerts: 0 }),
      ).total,
    ).toBe(0);
  });

  it('si falta cualquiera de las dos, el total no se muestra (nunca 0)', () => {
    expect(
      criticalAlertsTotal(
        view(S.READY, {
          pendingInactivityAlerts: 2,
          pendingCravingAlerts: null,
        }),
      ).total,
    ).toBeNull();
    expect(criticalAlertsTotal(view(S.UNAVAILABLE, null)).total).toBeNull();
    expect(
      criticalAlertsTotal(view(S.NOT_CONSOLIDATED, null)).total,
    ).toBeNull();
    expect(criticalAlertsTotal(null).total).toBeNull();
  });

  it('con la vista conductual desactualizada, el total también lo está', () => {
    expect(
      criticalAlertsTotal(
        view(S.STALE, { pendingInactivityAlerts: 1, pendingCravingAlerts: 4 }),
      ),
    ).toEqual({ total: 5, isStale: true });
  });
});

describe('Ensamblaje, caché y modo degradado (RF-140)', () => {
  const LOADED = '2026-11-22T14:00:00.000Z';

  async function liveResults(changes) {
    return loadDashboardSections(COHORT, queries(changes));
  }

  it('ensambla el contrato lógico con el total y la fecha de carga', async () => {
    const dashboard = assembleDashboard({
      cohortId: COHORT,
      results: await liveResults(),
      loadedAt: LOADED,
      cache: createDashboardCache(),
    });

    expect(dashboard).toMatchObject({
      id_cohorte: COHORT,
      total_alertas_criticas_pendientes: 3,
      alertas_desactualizadas: false,
      fecha_carga_pantalla: LOADED,
      origen_panel: PANEL_SOURCE.LIVE,
    });
    expect(dashboard.vista_conductual.section).toBe(SEC.BEHAVIORAL);
  });

  it('una falla parcial no usa la caché: la sección queda no disponible', async () => {
    const cache = createDashboardCache();
    rememberValidSections(cache, COHORT, await liveResults(), LOADED);

    const dashboard = assembleDashboard({
      cohortId: COHORT,
      results: await liveResults({ [SEC.NARRATIVE]: failing() }),
      loadedAt: LOADED,
      cache,
    });

    expect(dashboard.origen_panel).toBe(PANEL_SOURCE.LIVE);
    expect(dashboard.vista_narrativa.outcome).toBe(OUT.REJECTED);
  });

  it('ninguna fuente responde y sin caché: panel no disponible, sin datos fabricados', async () => {
    const dashboard = assembleDashboard({
      cohortId: COHORT,
      results: await liveResults({
        [SEC.BEHAVIORAL]: failing(),
        [SEC.NARRATIVE]: failing(),
        [SEC.NOTIFICATIONS]: failing(),
      }),
      loadedAt: LOADED,
      cache: createDashboardCache(),
    });

    expect(dashboard.origen_panel).toBe(PANEL_SOURCE.UNAVAILABLE);
    expect(dashboard.total_alertas_criticas_pendientes).toBeNull();
    expect(dashboard.vista_conductual.view.data).toBeNull();
  });

  it('ninguna fuente responde con caché: última versión válida marcada como desactualizada', async () => {
    const cache = createDashboardCache();
    rememberValidSections(cache, COHORT, await liveResults(), LOADED);

    const dashboard = assembleDashboard({
      cohortId: COHORT,
      results: await loadDashboardSections(
        COHORT,
        queries({
          [SEC.BEHAVIORAL]: failing(),
          [SEC.NARRATIVE]: never(),
          [SEC.NOTIFICATIONS]: failing(),
        }),
        50,
      ),
      loadedAt: '2026-11-22T15:00:00.000Z',
      cache,
    });

    expect(dashboard.origen_panel).toBe(PANEL_SOURCE.CACHED);
    expect(dashboard.vista_conductual).toMatchObject({
      outcome: OUT.CACHED,
      cachedAt: LOADED,
      view: { status: S.STALE },
    });
    expect(dashboard.total_alertas_criticas_pendientes).toBe(3);
    expect(dashboard.alertas_desactualizadas).toBe(true);
  }, 15000);

  it('la caché de una cohorte nunca se usa para otra', async () => {
    const cache = createDashboardCache();
    rememberValidSections(cache, COHORT, await liveResults(), LOADED);

    const otherFailed = await loadDashboardSections(
      'demo-cohorte-c',
      queries({
        [SEC.BEHAVIORAL]: failing(),
        [SEC.NARRATIVE]: failing(),
        [SEC.NOTIFICATIONS]: failing(),
      }),
    );
    const dashboard = assembleDashboard({
      cohortId: 'demo-cohorte-c',
      results: otherFailed,
      loadedAt: LOADED,
      cache,
    });

    expect(dashboard.origen_panel).toBe(PANEL_SOURCE.UNAVAILABLE);
    expect(JSON.stringify(dashboard)).not.toContain('"activeUsers":18');
  });

  it('solo conserva vistas con datos: nunca una vista sin datos ni un error', async () => {
    const cache = createDashboardCache();
    rememberValidSections(
      cache,
      COHORT,
      await liveResults({
        [SEC.BEHAVIORAL]: failing(),
        [SEC.NARRATIVE]: resolved({
          ...NARRATIVE,
          datos: null,
          motivo_sin_datos: 'SIN_CONSOLIDAR',
        }),
      }),
      LOADED,
    );

    expect(cache.recall(COHORT, SEC.BEHAVIORAL)).toBeNull();
    expect(cache.recall(COHORT, SEC.NARRATIVE)).toBeNull();
    expect(cache.recall(COHORT, SEC.NOTIFICATIONS)).not.toBeNull();
  });
});
