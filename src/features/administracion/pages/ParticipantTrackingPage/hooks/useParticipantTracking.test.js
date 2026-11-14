import { beforeEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_TRACKING_QUERY } from '../../../services/trackingQuery.js';
import { TRACKING_ACCESS, TRACKING_PAGE_SIZE, TRACKING_SOURCE_MODE } from '../../../types/participantTracking.js';
import { TRACKING_PROBLEM, useParticipantTracking } from './useParticipantTracking.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial
 * (o el fijado en `react.values` por posición) con un setter espía;
 * useEffect se guarda para ejecutarlo.
 */
const react = vi.hoisted(() => ({ setters: [], effects: [], values: {}, index: 0 }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const position = react.index;
    react.index += 1;
    const setter = vi.fn();
    react.setters.push(setter);
    const value = position in react.values ? react.values[position] : initial;
    return [typeof value === 'function' ? value() : value, setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
}));

// Orden de los useState del hook.
const QUERY = 1;
const COHORT = 2;
const PAGE = 3;
const LOADING = 4;
const PROBLEM = 5;
const ATTEMPT = 6;

// Orden de los efectos: cohorte, indicadores.
const COHORT_EFFECT = 0;
const TRACKING_EFFECT = 1;

const granted = (items, changes = {}) => ({
  access: TRACKING_ACCESS.GRANTED,
  cohortId: 'c-1',
  total: items.length,
  offset: 0,
  limit: TRACKING_PAGE_SIZE,
  items,
  ...changes,
});

const ITEM = Object.freeze({ cohortId: 'c-1', code: 'X-1', progress: 40, adherence: 60, activeAlertCount: 2, participantId: 'interno' });

function source({ mode = TRACKING_SOURCE_MODE.DEMO, list, getCohort } = {}) {
  return {
    getMode: () => mode,
    getCohort: getCohort ?? vi.fn().mockResolvedValue({ id: 'c-1', name: 'Cohorte' }),
    list: list ?? vi.fn().mockResolvedValue(granted([ITEM])),
  };
}

function renderHookWith(hook, args, values = {}) {
  react.setters = [];
  react.effects = [];
  react.index = 0;
  react.values = values;
  return hook({ cohortId: 'c-1', ...args });
}

async function loadWith(src) {
  renderHookWith(useParticipantTracking, { source: src });
  react.effects[TRACKING_EFFECT]();
  await vi.waitFor(() => expect(react.setters[LOADING]).toHaveBeenLastCalledWith(false));
}

const lastValue = (position) => react.setters[position].mock.lastCall?.[0];

beforeEach(() => {
  react.values = {};
});

describe('useParticipantTracking: fuente', () => {
  it('con la integración pendiente no consulta nada', () => {
    const src = source({ mode: TRACKING_SOURCE_MODE.PENDING_INTEGRATION });
    const result = renderHookWith(useParticipantTracking, { source: src });

    expect(result).toMatchObject({ isIntegrationPending: true, isDemo: false, isLoading: false, entries: [] });
    expect(react.effects[COHORT_EFFECT]()).toBeUndefined();
    expect(react.effects[TRACKING_EFFECT]()).toBeUndefined();
    expect(src.list).not.toHaveBeenCalled();
    expect(src.getCohort).not.toHaveBeenCalled();
  });

  it('pide a la fuente la cohorte y la consulta normalizada', async () => {
    const src = source();
    await loadWith(src);

    expect(src.list).toHaveBeenCalledWith('c-1', INITIAL_TRACKING_QUERY);
    react.effects[COHORT_EFFECT]();
    expect(src.getCohort).toHaveBeenCalledWith('c-1');
  });

  it('con autorización explícita conserva solo los campos permitidos', async () => {
    await loadWith(source());

    expect(lastValue(PAGE).entries).toEqual([{ code: 'X-1', progress: 40, adherence: 60, activeAlertCount: 2 }]);
    expect(react.setters[PROBLEM]).toHaveBeenLastCalledWith(null);
  });
});

describe('useParticipantTracking: permisos y errores', () => {
  it('DENEGADO: ningún registro, aunque la respuesta los traiga', async () => {
    await loadWith(source({ list: vi.fn().mockResolvedValue(granted([ITEM], { access: TRACKING_ACCESS.DENIED })) }));

    expect(lastValue(PROBLEM)).toBe(TRACKING_PROBLEM.DENIED);
    expect(lastValue(PAGE).entries).toEqual([]);
  });

  it('una respuesta sin campo de autorización se trata como denegada', async () => {
    await loadWith(source({ list: vi.fn().mockResolvedValue(granted([ITEM], { access: undefined })) }));

    expect(lastValue(PROBLEM)).toBe(TRACKING_PROBLEM.DENIED);
  });

  it.each([
    ['ACCESO_DENEGADO', TRACKING_PROBLEM.DENIED],
    ['COHORTE_NO_ENCONTRADA', TRACKING_PROBLEM.NOT_FOUND],
    [undefined, TRACKING_PROBLEM.ERROR],
  ])('rechazo con código %s', async (code, problem) => {
    await loadWith(source({ list: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { code })) }));

    expect(lastValue(PROBLEM)).toBe(problem);
    expect(lastValue(PAGE).entries).toEqual([]);
  });

  it('el texto del error no decide: «denegado» sin código es un error genérico', async () => {
    await loadWith(source({ list: vi.fn().mockRejectedValue(new Error('Acceso denegado')) }));

    expect(lastValue(PROBLEM)).toBe(TRACKING_PROBLEM.ERROR);
  });

  it('una respuesta de otra cohorte se bloquea entera', async () => {
    await loadWith(source({ list: vi.fn().mockResolvedValue(granted([ITEM], { cohortId: 'c-2' })) }));

    expect(lastValue(PROBLEM)).toBe(TRACKING_PROBLEM.INCONSISTENT);
    expect(lastValue(PAGE).entries).toEqual([]);
  });

  it('un registro de otra cohorte se oculta y se cuenta', async () => {
    await loadWith(source({ list: vi.fn().mockResolvedValue(granted([ITEM, { ...ITEM, cohortId: 'c-9', code: 'AJENO' }])) }));

    expect(lastValue(PAGE).entries.map(({ code }) => code)).toEqual(['X-1']);
    expect(lastValue(PAGE).blockedCount).toBe(1);
  });

  it('ignora la respuesta si el componente ya se desmontó', async () => {
    let resolve;
    renderHookWith(useParticipantTracking, { source: source({ list: () => new Promise((done) => { resolve = done; }) }) });

    const cleanup = react.effects[TRACKING_EFFECT]();
    cleanup();
    resolve(granted([ITEM]));
    await new Promise((done) => setTimeout(done, 0));
    expect(react.setters[PAGE]).not.toHaveBeenCalled();
  });
});

describe('useParticipantTracking: filtros, orden y paginación', () => {
  const PAGE_OF_12 = Object.freeze({ entries: Object.freeze([]), total: 12, offset: 0, blockedCount: 0 });

  it('un filtro u orden actualiza la consulta y vuelve a la primera página', () => {
    const result = renderHookWith(useParticipantTracking, { source: source() });

    result.setFilter('alerts', 'con-alertas');
    expect(lastValue(QUERY)({ ...INITIAL_TRACKING_QUERY, offset: 5 })).toMatchObject({ offset: 0, filters: { alerts: 'con-alertas' } });
    result.setSort('progreso-desc');
    expect(lastValue(QUERY)(INITIAL_TRACKING_QUERY).sort).toEqual({ field: 'progreso', direction: 'desc' });
    result.clearFilters();
    expect(lastValue(QUERY)({ ...INITIAL_TRACKING_QUERY, filters: { progressMin: 50, adherenceMin: null, alerts: null } }).filters.progressMin).toBeNull();
  });

  it('pagina hacia delante y hacia atrás dentro del total', () => {
    const result = renderHookWith(useParticipantTracking, { source: source() }, { [PAGE]: PAGE_OF_12 });

    expect(result).toMatchObject({ pageNumber: 1, pageCount: 3, canGoBack: false, canGoForward: true });
    result.goForward();
    expect(lastValue(QUERY)(INITIAL_TRACKING_QUERY).offset).toBe(TRACKING_PAGE_SIZE);
    result.goBack();
    expect(lastValue(QUERY)({ ...INITIAL_TRACKING_QUERY, offset: 5 }).offset).toBe(0);
  });

  it('informa el rango mostrado', () => {
    const page = { entries: [{ code: 'A' }, { code: 'B' }], total: 7, offset: 5, blockedCount: 0 };
    const result = renderHookWith(useParticipantTracking, { source: source() }, {
      [QUERY]: { ...INITIAL_TRACKING_QUERY, offset: 5 },
      [PAGE]: page,
    });

    expect(result).toMatchObject({ range: { from: 6, to: 7 }, pageNumber: 2, pageCount: 2, canGoBack: true, canGoForward: false });
  });

  it('solo consulta: no expone operaciones de escritura', () => {
    const result = renderHookWith(useParticipantTracking, { source: source() });
    const operations = Object.keys(result).filter((key) => typeof result[key] === 'function');

    expect(operations).toEqual(['setFilter', 'setSort', 'clearFilters', 'goBack', 'goForward', 'retry']);
    result.retry();
    expect(react.setters[ATTEMPT]).toHaveBeenCalledTimes(1);
  });

  it('carga la cohorte para el encabezado y tolera su fallo', async () => {
    const getCohort = vi.fn().mockRejectedValue(new Error('x'));
    renderHookWith(useParticipantTracking, { source: source({ getCohort }) });

    react.effects[COHORT_EFFECT]();
    await vi.waitFor(() => expect(react.setters[COHORT]).toHaveBeenLastCalledWith(null));
  });
});
