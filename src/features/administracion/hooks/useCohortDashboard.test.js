import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDashboardCache } from '../services/dashboardCache.js';
import {
  DASHBOARD_SECTION as SEC,
  DASHBOARD_STATUS as ST,
} from '../types/cohortDashboard.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';
import { useCohortDashboard } from './useCohortDashboard.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial con
 * un setter espía; useEffect se guarda para ejecutarlo; useRef es un
 * objeto simple.
 */
const react = vi.hoisted(() => ({ setters: [], effects: [] }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const setter = vi.fn();
    react.setters.push(setter);
    return [typeof initial === 'function' ? initial() : initial, setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
  useRef(initial) {
    return { current: initial };
  },
}));

// Orden de los useState del hook.
const STATE = 1;

const stateCalls = () =>
  react.setters[STATE].mock.calls.map(([value]) => value);
const lastState = () => stateCalls().at(-1);

const envelope = (datos) => ({
  id_cohorte: 'co-activa',
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: null,
  motivo_sin_datos: null,
  mensaje: null,
  datos,
});

const COHORTS = [
  { id: 'co-borrador', name: 'Borrador', status: COHORT_STATUS.DRAFT },
  { id: 'co-activa', name: 'Activa', status: COHORT_STATUS.ACTIVE },
];

function source({ listCohorts, queries = {} } = {}) {
  return {
    isDemo: () => true,
    listCohorts: listCohorts ?? vi.fn().mockResolvedValue(COHORTS),
    queries: {
      [SEC.BEHAVIORAL]: vi.fn().mockResolvedValue(
        envelope({
          alertas_inactividad_pendientes: 1,
          alertas_craving_pendientes: 2,
        }),
      ),
      [SEC.NARRATIVE]: vi
        .fn()
        .mockResolvedValue(envelope({ total_logros_desbloqueados: 5 })),
      [SEC.NOTIFICATIONS]: vi
        .fn()
        .mockResolvedValue(envelope({ total_notificaciones_enviadas: 9 })),
      ...queries,
    },
  };
}

async function flush() {
  for (const effect of react.effects) effect();
  for (let i = 0; i < 5; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

beforeEach(() => {
  react.setters = [];
  react.effects = [];
});

describe('useCohortDashboard (RF-140)', () => {
  it('identifica la cohorte activa y consulta las tres vistas para ella', async () => {
    const fuente = source();
    useCohortDashboard({ source: fuente, cache: createDashboardCache() });
    await flush();

    for (const query of Object.values(fuente.queries)) {
      expect(query).toHaveBeenCalledWith('co-activa');
    }
    expect(lastState()).toMatchObject({
      status: ST.READY,
      cohort: { id: 'co-activa' },
    });
    expect(Object.keys(lastState().results)).toHaveLength(3);
    expect(lastState().loadedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('cada carga empieza sin indicadores ni cohorte anteriores', async () => {
    useCohortDashboard({ source: source(), cache: createDashboardCache() });
    await flush();

    expect(stateCalls()[0]).toMatchObject({
      status: ST.LOADING,
      cohort: null,
      results: null,
    });
  });

  it('guarda en caché las vistas válidas de la cohorte activa', async () => {
    const cache = createDashboardCache();
    useCohortDashboard({ source: source(), cache });
    await flush();

    expect(cache.recall('co-activa', SEC.BEHAVIORAL)).not.toBeNull();
    expect(cache.recall('co-borrador', SEC.BEHAVIORAL)).toBeNull();
  });

  it('sin cohorte activa: estado funcional y ninguna vista consultada', async () => {
    const fuente = source({
      listCohorts: vi.fn().mockResolvedValue([COHORTS[0]]),
    });
    useCohortDashboard({ source: fuente, cache: createDashboardCache() });
    await flush();

    expect(lastState()).toMatchObject({
      status: ST.NO_ACTIVE_COHORT,
      results: null,
    });
    expect(fuente.queries[SEC.BEHAVIORAL]).not.toHaveBeenCalled();
  });

  it('varias cohortes activas: no elige ninguna', async () => {
    const fuente = source({
      listCohorts: vi.fn().mockResolvedValue([
        { id: 'x', name: 'X', status: COHORT_STATUS.ACTIVE },
        { id: 'y', name: 'Y', status: COHORT_STATUS.ACTIVE },
      ]),
    });
    useCohortDashboard({ source: fuente, cache: createDashboardCache() });
    await flush();

    expect(lastState()).toMatchObject({
      status: ST.MULTIPLE_ACTIVE_COHORTS,
      cohort: null,
    });
    expect(lastState().activeCohorts).toHaveLength(2);
    expect(fuente.queries[SEC.NARRATIVE]).not.toHaveBeenCalled();
  });

  it('si falla la consulta de cohortes: error recuperable, sin indicadores', async () => {
    const fuente = source({
      listCohorts: vi.fn().mockRejectedValue(new Error('caída')),
    });
    const result = useCohortDashboard({
      source: fuente,
      cache: createDashboardCache(),
    });
    await flush();

    expect(lastState()).toMatchObject({
      status: ST.COHORTS_ERROR,
      results: null,
    });

    // Reintento: vuelve a ejecutar la carga completa.
    result.reload();
    const updater = react.setters[3].mock.calls.at(-1)[0];
    expect(updater(0)).toBe(1);
  });

  it('la consulta de cohortes también tiene tiempo límite', async () => {
    vi.useFakeTimers();
    const fuente = source({ listCohorts: vi.fn(() => new Promise(() => {})) });
    useCohortDashboard({
      source: fuente,
      cache: createDashboardCache(),
      timeoutMs: 100,
    });
    for (const effect of react.effects) effect();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(lastState().status).toBe(ST.COHORTS_ERROR);
  });

  it('usa una consulta consolidada y la cohorte definida por el servidor', async () => {
    const fuente = {
      ...source(),
      isDemo: () => false,
      getDashboard: vi.fn().mockResolvedValue({
        estado: 'DISPONIBLE',
        id_cohorte: 'co-activa',
        [SEC.BEHAVIORAL]: envelope({
          alertas_inactividad_pendientes: 1,
          alertas_craving_pendientes: 2,
        }),
        total_alertas_criticas_pendientes: 0,
        fecha_carga_pantalla: '2026-11-24T12:00:00Z',
      }),
    };
    const result = useCohortDashboard({
      source: fuente,
      cache: createDashboardCache(),
    });
    await flush();

    expect(result.isDemo).toBe(false);
    expect(lastState()).toMatchObject({
      status: ST.READY,
      cohort: { id: 'co-activa' },
      dashboard: {
        total_alertas_criticas_pendientes: 0,
        fecha_carga_pantalla: '2026-11-24T12:00:00Z',
      },
    });
    expect(fuente.getDashboard).toHaveBeenCalledTimes(1);
    expect(fuente.listCohorts).not.toHaveBeenCalled();
    for (const query of Object.values(fuente.queries))
      expect(query).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'NO_AUTENTICADO', ST.ACCESS_DENIED],
    [403, 'SIN_PERMISO', ST.ACCESS_DENIED],
    [409, 'COHORTE_ACTIVA_AMBIGUA', ST.MULTIPLE_ACTIVE_COHORTS],
    [409, 'COHORTE_ACTIVA_CAMBIO', ST.COHORTS_ERROR],
    [500, 'ERROR_REGISTRO_AUDITORIA', ST.PANEL_ERROR],
  ])(
    'maneja HTTP %i %s sin mostrar indicadores',
    async (status, codigo, expected) => {
      useCohortDashboard({
        source: {
          isDemo: () => false,
          getDashboard: vi.fn().mockRejectedValue({ status, codigo }),
        },
      });
      await flush();
      expect(lastState()).toMatchObject({
        status: expected,
        cohort: null,
        dashboard: null,
      });
    },
  );
});
