import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COHORT_SOURCE_MODE } from '../../../types/cohortSourceMode.js';
import { COHORT_LIST_ERROR_MESSAGE, useCohortList } from './useCohortList.js';

// React mínimo para entorno node: useState devuelve el estado
// inicial con un setter espía; useEffect se guarda para ejecutarlo.
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
const SET_COHORTS = 1;
const SET_LOADING = 2;
const SET_ERROR = 3;
const SET_ATTEMPT = 4;

beforeEach(() => {
  react.setters = [];
  react.effects = [];
});

const source = (mode, list = vi.fn()) => ({ getMode: () => mode, list });

describe('useCohortList', () => {
  it('con la integración pendiente no consulta ninguna fuente', () => {
    const list = vi.fn();
    const result = useCohortList({ source: source(COHORT_SOURCE_MODE.PENDING_INTEGRATION, list) });

    expect(result).toMatchObject({ isIntegrationPending: true, isDemo: false, isLoading: false });
    react.effects[0]();
    expect(list).not.toHaveBeenCalled();
  });

  it('carga las cohortes desde la fuente y deja de cargar', async () => {
    const cohorts = [{ id: 'c-1', status: 'ACTIVA' }];
    const result = useCohortList({
      source: source(COHORT_SOURCE_MODE.DEMO, vi.fn().mockResolvedValue(cohorts)),
    });

    expect(result).toMatchObject({ isDemo: true, isLoading: true });
    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[SET_LOADING]).toHaveBeenLastCalledWith(false));
    expect(react.setters[SET_COHORTS]).toHaveBeenLastCalledWith(cohorts);
    expect(react.setters[SET_ERROR]).not.toHaveBeenCalledWith(COHORT_LIST_ERROR_MESSAGE);
  });

  it('un fallo es un error, nunca una lista con datos de reemplazo', async () => {
    useCohortList({
      source: source(COHORT_SOURCE_MODE.DEMO, vi.fn().mockRejectedValue(new Error('x'))),
    });

    react.effects[0]();
    await vi.waitFor(() =>
      expect(react.setters[SET_ERROR]).toHaveBeenLastCalledWith(COHORT_LIST_ERROR_MESSAGE),
    );
    expect(react.setters[SET_COHORTS]).toHaveBeenLastCalledWith([]);
  });

  it('una respuesta que no es una lista se trata como vacía', async () => {
    useCohortList({ source: source(COHORT_SOURCE_MODE.DEMO, vi.fn().mockResolvedValue(null)) });

    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[SET_COHORTS]).toHaveBeenLastCalledWith([]));
  });

  it('ignora la respuesta si el componente ya se desmontó', async () => {
    let resolve;
    useCohortList({
      source: source(COHORT_SOURCE_MODE.DEMO, () => new Promise((done) => { resolve = done; })),
    });

    const cleanup = react.effects[0]();
    cleanup();
    resolve([{ id: 'c-1' }]);
    await new Promise((done) => setTimeout(done, 0));
    expect(react.setters[SET_COHORTS]).not.toHaveBeenCalled();
  });

  it('reintentar vuelve a consultar', () => {
    const { retry } = useCohortList({ source: source(COHORT_SOURCE_MODE.DEMO) });

    retry();
    expect(react.setters[SET_ATTEMPT]).toHaveBeenCalledTimes(1);
  });
});
