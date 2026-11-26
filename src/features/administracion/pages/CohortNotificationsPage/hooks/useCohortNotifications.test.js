import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AGGREGATE_SOURCE_MODE,
  AGGREGATE_VIEW_STATUS as S,
} from '../../../types/behavioralAggregate.js';
import { useCohortNotifications } from './useCohortNotifications.js';

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
const COHORT = 1;
const VIEW = 2;
const LOADING = 3;

const lastCall = (position) => react.setters[position].mock.calls.at(-1)?.[0];

const RESPONSE = Object.freeze({
  id_cohorte: 'c-1',
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: '2026-11-15T05:00:00Z',
  motivo_sin_datos: null,
  mensaje: null,
  datos: { tasa_apertura_promedio: 0.61, total_notificaciones_enviadas: 9 },
});

function source({
  mode = AGGREGATE_SOURCE_MODE.DEMO,
  getAggregate,
  getCohort,
} = {}) {
  return {
    getMode: () => mode,
    getCohort:
      getCohort ?? vi.fn().mockResolvedValue({ id: 'c-1', name: 'Cohorte' }),
    getAggregate: getAggregate ?? vi.fn().mockResolvedValue(RESPONSE),
  };
}

async function runEffects() {
  for (const effect of react.effects) effect();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  react.setters = [];
  react.effects = [];
});

describe('useCohortNotifications (RF-134)', () => {
  it('consulta la vista de la cohorte pedida y la interpreta', async () => {
    const fuente = source();
    useCohortNotifications({ cohortId: 'c-1', source: fuente });
    await runEffects();

    expect(fuente.getAggregate).toHaveBeenCalledWith('c-1');
    expect(lastCall(VIEW)).toMatchObject({
      status: S.READY,
      data: { averageOpenRate: 0.61, sentNotifications: 9 },
    });
    expect(lastCall(LOADING)).toBe(false);
  });

  it('una respuesta de otra cohorte no deja datos visibles', async () => {
    const fuente = source({
      getAggregate: vi
        .fn()
        .mockResolvedValue({ ...RESPONSE, id_cohorte: 'c-2' }),
    });
    useCohortNotifications({ cohortId: 'c-1', source: fuente });
    await runEffects();

    expect(lastCall(VIEW)).toMatchObject({
      status: S.INCONSISTENT,
      data: null,
    });
  });

  it('si falla el nombre de la cohorte, la vista se muestra igual', async () => {
    const fuente = source({
      getCohort: vi.fn().mockRejectedValue(new Error('caída')),
    });
    useCohortNotifications({ cohortId: 'c-1', source: fuente });
    await runEffects();

    expect(lastCall(COHORT)).toBeNull();
    expect(lastCall(VIEW).status).toBe(S.READY);
  });

  it('una falla de M07 no se reemplaza por datos', async () => {
    const fuente = source({
      getAggregate: vi.fn().mockRejectedValue(new Error('M07 caído')),
    });
    useCohortNotifications({ cohortId: 'c-1', source: fuente });
    await runEffects();

    expect(lastCall(VIEW)).toEqual({ status: S.ERROR, data: null });
  });

  it('cada consulta empieza sin la vista anterior', async () => {
    useCohortNotifications({ cohortId: 'c-1', source: source() });
    await runEffects();

    expect(react.setters[VIEW].mock.calls[0][0]).toBeNull();
  });

  it('con la integración pendiente no consulta nada', async () => {
    const fuente = source({ mode: AGGREGATE_SOURCE_MODE.PENDING_INTEGRATION });
    const result = useCohortNotifications({ cohortId: 'c-1', source: fuente });
    await runEffects();

    expect(result.isIntegrationPending).toBe(true);
    expect(result.isLoading).toBe(false);
    expect(fuente.getAggregate).not.toHaveBeenCalled();
    expect(fuente.getCohort).not.toHaveBeenCalled();
  });
});
