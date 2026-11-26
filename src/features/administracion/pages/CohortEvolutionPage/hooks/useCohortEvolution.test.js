import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_SCHEDULE_1_UNITS } from '../../../data/cohortEvolutionDemoData.js';
import { AGGREGATE_SOURCE_MODE } from '../../../types/behavioralAggregate.js';
import { EVOLUTION_STATUS as S } from '../../../types/cohortEvolution.js';
import { useCohortEvolution } from './useCohortEvolution.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial con
 * un setter espía; useEffect se guarda para ejecutarlo.
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
}));

// Orden de los useState del hook.
const VIEW = 2;
const lastView = () => react.setters[VIEW].mock.calls.at(-1)?.[0];

const IDS = DEMO_SCHEDULE_1_UNITS.map(({ id_unidad_temporal: id }) => id);
const RESPONSE = Object.freeze({
  id_cohorte: 'c-1',
  serie_unidades_temporales: [IDS[0], IDS[1]],
  serie_adherencia_promedio: [0.8, 0.7],
  serie_nivel_progreso_distribucion: [null, null],
  serie_craving_promedio: [5, 4],
  unidades_con_datos_insuficientes: [],
  fecha_actualizacion: '2026-11-21T12:00:00Z',
});

function source(changes = {}) {
  return {
    getMode: () => AGGREGATE_SOURCE_MODE.API,
    getCohort: vi.fn().mockResolvedValue({
      id: 'c-1',
      name: 'Cohorte',
      scheduleId: 'schedule-1',
    }),
    getUnits: vi.fn().mockResolvedValue(DEMO_SCHEDULE_1_UNITS),
    getEvolution: vi.fn().mockResolvedValue(RESPONSE),
    ...changes,
  };
}

async function flush() {
  for (const effect of react.effects) effect();
  for (let i = 0; i < 4; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

beforeEach(() => {
  react.setters = [];
  react.effects = [];
});

describe('useCohortEvolution (RF-141)', () => {
  it('pide catálogo y serie de la cohorte y los interpreta juntos', async () => {
    const fuente = source();
    useCohortEvolution({ cohortId: 'c-1', source: fuente });
    await flush();

    expect(fuente.getCohort).toHaveBeenCalledExactlyOnceWith('c-1');
    expect(fuente.getUnits).toHaveBeenCalledExactlyOnceWith(
      'c-1',
      expect.objectContaining({ scheduleId: 'schedule-1' }),
    );
    expect(fuente.getEvolution).toHaveBeenCalledWith('c-1', { filters: null });
    expect(lastView()).toMatchObject({ status: S.READY });
    expect(lastView().units.map(({ label }) => label)).toEqual([
      'Semana 1',
      'Semana 2',
    ]);
  });

  it('reenvía los filtros de RF-135 a la fuente sin aplicarlos en el navegador', async () => {
    const fuente = source();
    const filters = { modalidad_terapeutica: 'PERSONALIZADA' };
    useCohortEvolution({ cohortId: 'c-1', filters, source: fuente });
    await flush();

    expect(fuente.getEvolution).toHaveBeenCalledWith('c-1', { filters });
  });

  it('si M05 no responde, ninguna serie parcial', async () => {
    const fuente = source({
      getEvolution: vi.fn().mockRejectedValue({
        status: 503,
        codigo: 'SEGUIMIENTO_NO_DISPONIBLE',
      }),
    });
    useCohortEvolution({ cohortId: 'c-1', source: fuente });
    await flush();

    expect(lastView()).toEqual({ status: S.UNAVAILABLE, units: [] });
    expect(fuente.getUnits).not.toHaveBeenCalled();
  });

  it('si falla el catálogo de unidades, tampoco hay serie', async () => {
    const fuente = source({
      getUnits: vi.fn().mockRejectedValue(new Error('x')),
    });
    useCohortEvolution({ cohortId: 'c-1', source: fuente });
    await flush();

    expect(lastView()).toEqual({ status: S.ERROR, units: [] });
  });

  it('una fuente que no responde termina por tiempo límite como M05 no disponible', async () => {
    vi.useFakeTimers();
    const fuente = source({ getEvolution: vi.fn(() => new Promise(() => {})) });
    useCohortEvolution({ cohortId: 'c-1', source: fuente, timeoutMs: 100 });
    for (const effect of react.effects) effect();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(lastView()).toEqual({ status: S.UNAVAILABLE, units: [] });
  });

  it('cada consulta empieza sin la serie anterior', async () => {
    useCohortEvolution({ cohortId: 'c-1', source: source() });
    await flush();

    expect(react.setters[VIEW].mock.calls[0][0]).toBeNull();
  });

  it('con una sola unidad muestra el estado funcional aunque falle el detalle de cohorte', async () => {
    const fuente = source({
      getCohort: vi
        .fn()
        .mockRejectedValue(new Error('No se pudo cargar el detalle')),
      getEvolution: vi.fn().mockResolvedValue({
        ...RESPONSE,
        serie_unidades_temporales: [IDS[0]],
        serie_adherencia_promedio: [null],
        serie_nivel_progreso_distribucion: [{}],
        serie_craving_promedio: [null],
        unidades_con_datos_insuficientes: [IDS[0]],
      }),
    });
    const result = useCohortEvolution({ cohortId: 'c-1', source: fuente });
    await flush();

    expect(result.isLoading).toBe(true);
    expect(lastView()).toMatchObject({
      status: S.INSUFFICIENT_UNITS,
      units: [],
    });
    expect(fuente.getUnits).not.toHaveBeenCalled();
  });
});
