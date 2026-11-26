import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import { INITIAL_TRACKING_QUERY, toTrackingParams } from '../../../services/trackingQuery.js';
import { TRACKING_PAGE_SIZE, TRACKING_SOURCE_MODE } from '../../../types/participantTracking.js';
import { TRACKING_DEBOUNCE_MS, TRACKING_PROBLEM, useParticipantTracking } from './useParticipantTracking.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial
 * (o el fijado en `react.values` por posición) con un setter espía;
 * useEffect se guarda para ejecutarlo.
 */
const react = vi.hoisted(() => ({ setters: [], effects: [], deps: [], values: {}, index: 0 }));

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
  useEffect(effect, deps) {
    react.effects.push(effect);
    react.deps.push(deps);
  },
}));

// Orden de los useState del hook.
const DRAFT = 1;
const COHORT = 2;
const PAGE = 3;
const LOADING = 4;
const PROBLEM = 5;
const ATTEMPT = 6;

// Orden de los efectos: cohorte, URL canónica, debounce, indicadores.
const COHORT_EFFECT = 0;
const CANONICAL_EFFECT = 1;
const DEBOUNCE_EFFECT = 2;
const TRACKING_EFFECT = 3;

const ITEM = Object.freeze({
  codigo_participante: 'P-7F3A91C2',
  nivel_progreso: 'EN_AVANCE',
  tasa_adherencia: 0.41,
  alertas_activas: 2,
  alertas_atendidas: 0,
  tipos_alerta_activa: ['INACTIVIDAD', 'CRAVING_ELEVADO'],
  correo: 'nunca@se.muestra',
});

const body = (items, changes = {}) => ({ items, total: items.length, offset: 0, limit: TRACKING_PAGE_SIZE, ...changes });

const http = (status, codigo) => toApiError({ response: { status, data: { status, codigo, mensaje: 'Mensaje.' } } });

function source({ mode = TRACKING_SOURCE_MODE.API, list, getCohort } = {}) {
  return {
    getMode: () => mode,
    getCohort: getCohort ?? vi.fn().mockResolvedValue({ id: 'c-1', name: 'Cohorte' }),
    list: list ?? vi.fn().mockResolvedValue(body([ITEM])),
  };
}

const navigate = vi.fn();

function renderHookWith(args, values = {}, hook = useParticipantTracking) {
  react.setters = [];
  react.effects = [];
  react.deps = [];
  react.index = 0;
  react.values = values;
  return hook({ cohortId: 'c-1', navigate, ...args });
}

async function loadWith(src, values = {}, search = '') {
  renderHookWith({ source: src, search }, values);
  const cleanup = react.effects[TRACKING_EFFECT]();
  await vi.waitFor(() => expect(src.list).toHaveBeenCalled());
  await new Promise((resolve) => setTimeout(resolve, 0));
  return cleanup;
}

const lastValue = (position) => react.setters[position].mock.lastCall?.[0];

beforeEach(() => {
  react.values = {};
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('useParticipantTracking (RF-142): consulta real', () => {
  it('pide la consulta normalizada con señal de cancelación', async () => {
    const src = source();
    await loadWith(src);

    expect(src.list).toHaveBeenCalledWith('c-1', INITIAL_TRACKING_QUERY, { signal: expect.any(AbortSignal) });
  });

  it('200 con participantes: registros del contrato sin campos ajenos y con código de ficha', async () => {
    await loadWith(source());

    expect(lastValue(PAGE).entries).toEqual([
      {
        code: 'P-7F3A91C2',
        progressLevel: 'EN_AVANCE',
        adherence: 0.41,
        activeAlertCount: 2,
        attendedAlertCount: 0,
        activeAlertTypes: ['INACTIVIDAD', 'CRAVING_ELEVADO'],
      },
    ]);
    expect(lastValue(LOADING)).toBe(false);
    expect(react.setters[PROBLEM]).toHaveBeenLastCalledWith(null);
  });

  it('expone el código A7 de cada registro para abrir su ficha; un código que no es A7 no enlaza', () => {
    const page = {
      entries: [
        { code: 'P-7F3A91C2', progressLevel: null, adherence: null, activeAlertCount: 0, attendedAlertCount: 0, activeAlertTypes: [] },
        { code: 'PART-0004', progressLevel: null, adherence: null, activeAlertCount: 0, attendedAlertCount: 0, activeAlertTypes: [] },
      ],
      total: 2,
      offset: 0,
    };
    const result = renderHookWith({ source: source() }, { [PAGE]: page });

    expect(result.entries.map(({ detailCode }) => detailCode)).toEqual(['P-7F3A91C2', null]);
  });

  it('en la demostración, el código ficticio abre la ficha ficticia', () => {
    const page = { entries: [{ code: 'PART-0004', progressLevel: null, adherence: null, activeAlertCount: 0, attendedAlertCount: 0, activeAlertTypes: [] }], total: 1, offset: 0 };
    const result = renderHookWith({ source: source({ mode: TRACKING_SOURCE_MODE.DEMO }) }, { [PAGE]: page });

    expect(result.isDemo).toBe(true);
    expect(result.entries[0].detailCode).toBe('PART-0004');
  });

  it('listado vacío: sin problema y total 0', async () => {
    await loadWith(source({ list: vi.fn().mockResolvedValue(body([], { mensaje: 'Sin participantes.' })) }));

    expect(lastValue(PAGE)).toMatchObject({ entries: [], total: 0 });
    expect(react.setters[PROBLEM]).toHaveBeenLastCalledWith(null);
  });

  it.each([
    [http(400, 'PARAMETRO_INVALIDO'), TRACKING_PROBLEM.INVALID_QUERY, false],
    [http(401, 'NO_AUTENTICADO'), TRACKING_PROBLEM.SESSION_REQUIRED, false],
    [http(403, 'ACCESO_DENEGADO'), TRACKING_PROBLEM.DENIED, false],
    [http(404, 'COHORTE_NO_ENCONTRADA'), TRACKING_PROBLEM.NOT_FOUND, false],
    [http(500, 'ERROR_LISTADO_INDICADORES'), TRACKING_PROBLEM.ERROR, true],
    [http(503, 'M05_NO_DISPONIBLE'), TRACKING_PROBLEM.UNAVAILABLE, true],
    [toApiError(new Error('Network Error')), TRACKING_PROBLEM.ERROR, true],
  ])('error %o: problema %s, sin registros visibles', async (error, problem, canRetry) => {
    await loadWith(source({ list: vi.fn().mockRejectedValue(error) }));

    expect(lastValue(PAGE).entries).toEqual([]);
    expect(lastValue(PROBLEM)).toBe(problem);
    expect(renderHookWith({ source: source() }, { [PROBLEM]: problem }).canRetry).toBe(canRetry);
  });

  it('respuesta malformada: ningún registro y problema propio', async () => {
    await loadWith(source({ list: vi.fn().mockResolvedValue(body([{ ...ITEM, tasa_adherencia: 41 }])) }));

    expect(lastValue(PAGE).entries).toEqual([]);
    expect(lastValue(PROBLEM)).toBe(TRACKING_PROBLEM.INVALID_RESPONSE);
  });

  it('página fuera de rango: pide la última página existente, sin inventar filas', async () => {
    const src = source({ list: vi.fn().mockResolvedValue(body([], { total: 41, offset: 60 })) });
    await loadWith(src, {}, '?pagina=4');

    expect(navigate).toHaveBeenCalledWith({ search: 'pagina=3' }, { replace: true });
    expect(react.setters[PAGE]).not.toHaveBeenCalled();
  });

  it('página vacía en la última posición válida: respuesta inválida, sin bucle', async () => {
    const src = source({ list: vi.fn().mockResolvedValue(body([], { total: 41, offset: 40 })) });
    await loadWith(src, {}, '?pagina=3');

    expect(navigate).not.toHaveBeenCalled();
    expect(lastValue(PROBLEM)).toBe(TRACKING_PROBLEM.INVALID_RESPONSE);
  });

  it('cancela la consulta anterior y descarta su respuesta tardía', async () => {
    let resolve;
    const list = vi.fn(() => new Promise((done) => { resolve = done; }));
    renderHookWith({ source: source({ list }) });
    const cleanup = react.effects[TRACKING_EFFECT]();
    const { signal } = list.mock.calls[0][2];

    cleanup();
    resolve(body([ITEM]));
    await new Promise((done) => setTimeout(done, 0));

    expect(signal.aborted).toBe(true);
    expect(react.setters[PAGE]).not.toHaveBeenCalled();
    expect(react.setters[LOADING]).not.toHaveBeenCalledWith(false);
  });

  it('el encabezado de la cohorte no depende de la consulta de participantes', async () => {
    const src = source();
    renderHookWith({ source: src });
    react.effects[COHORT_EFFECT]();
    await vi.waitFor(() => expect(react.setters[COHORT]).toHaveBeenCalledWith({ id: 'c-1', name: 'Cohorte' }));
  });
});

describe('useParticipantTracking (RF-142): controles', () => {
  it('filtros y orden quedan como borrador hasta el debounce; paginar es inmediato', () => {
    const result = renderHookWith({ source: source() }, { [PAGE]: { entries: [], total: 45, offset: 0 } });

    result.setFilter('level', 'AVANZADO');
    expect(react.setters[DRAFT].mock.lastCall[0](null).query.filters.level).toBe('AVANZADO');
    result.setSort('alertas_activas:DESC');
    expect(react.setters[DRAFT].mock.lastCall[0](null).query.sort).toEqual({ field: 'alertas_activas', direction: 'DESC' });
    expect(navigate).not.toHaveBeenCalled();

    result.goForward();
    expect(navigate).toHaveBeenLastCalledWith({ search: 'pagina=2' });
    result.retry();
    expect(react.setters[ATTEMPT].mock.lastCall[0](0)).toBe(1);
  });

  it('un cambio de filtro sobre la página 3 vuelve a la primera', () => {
    const result = renderHookWith({ source: source(), search: '?pagina=3' });

    result.setFilter('alerts', 'true');
    const draft = react.setters[DRAFT].mock.lastCall[0](null);
    expect(draft).toMatchObject({ base: 'pagina=3', query: { offset: 0, filters: { alerts: 'true' } } });
  });

  it('rango y páginas a partir del total del servidor', () => {
    const result = renderHookWith(
      { source: source(), search: '?pagina=2' },
      { [PAGE]: { entries: [{ code: 'P-00000001' }], total: 21, offset: 20 } },
    );

    expect(result).toMatchObject({ range: { from: 21, to: 21 }, pageNumber: 2, pageCount: 2, canGoBack: true, canGoForward: false });
  });

  it('encabezado de columna: orden inmediato y primera página', () => {
    const result = renderHookWith({ source: source(), search: '?nivel=INICIAL&pagina=2' });

    result.setColumnSort({ field: 'tasa_adherencia', direction: 'ASC' });
    expect(navigate).toHaveBeenLastCalledWith({ search: 'nivel=INICIAL&orden=tasa_adherencia&direccion=ASC' });
  });

  it('limpiar filtros: inmediato, conserva el orden y descarta el borrador', () => {
    const result = renderHookWith({ source: source(), search: '?nivel=INICIAL&orden=codigo_participante&direccion=DESC&pagina=2' });

    result.clearFilters();
    expect(navigate).toHaveBeenLastCalledWith({ search: 'orden=codigo_participante&direccion=DESC' });
    expect(react.setters[DRAFT]).toHaveBeenLastCalledWith(null);
  });

  it('los controles muestran el borrador pendiente, no la URL', () => {
    const draft = { ...INITIAL_TRACKING_QUERY, filters: { ...INITIAL_TRACKING_QUERY.filters, level: 'AVANZADO' } };
    const result = renderHookWith({ source: source() }, { [DRAFT]: { base: '', query: draft } });

    expect(result.filters.level).toBe('AVANZADO');
    expect(result.hasFilters).toBe(true);
  });
});

describe('useParticipantTracking (RF-142): URL y debounce', () => {
  it('la URL fija filtros, orden y página de la consulta', async () => {
    const src = source();
    await loadWith(src, {}, '?nivel=AVANZADO&adherencia_min=50&alertas=true&orden=tasa_adherencia&direccion=DESC&pagina=2');

    expect(toTrackingParams(src.list.mock.calls[0][1])).toEqual({
      nivel_progreso: 'AVANZADO',
      adherencia_min: 0.5,
      con_alertas: 'true',
      orden_campo: 'tasa_adherencia',
      orden_direccion: 'DESC',
      offset: 20,
      limit: TRACKING_PAGE_SIZE,
    });
    react.effects[CANONICAL_EFFECT]();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('parámetros ajenos o inválidos en la URL: se descartan y la URL se reescribe sin historial', async () => {
    const src = source();
    await loadWith(src, {}, '?correo=a@b.c&incluir_texto=true&texto_diario=1&nivel=EXPERTO&pagina=-3&adherencia_min=50&orden=correo&direccion=DESC');

    expect(toTrackingParams(src.list.mock.calls[0][1])).toEqual({ adherencia_min: 0.5, offset: 0, limit: TRACKING_PAGE_SIZE });
    react.effects[CANONICAL_EFFECT]();
    expect(navigate).toHaveBeenCalledWith({ search: 'adherencia_min=50' }, { replace: true });
  });

  it('URL equivalentes: misma clave de consulta, sin petición duplicada', () => {
    const src = source();
    renderHookWith({ source: src, search: '?nivel=AVANZADO&correo=x' });
    const first = react.deps[TRACKING_EFFECT];
    renderHookWith({ source: src, search: 'nivel=AVANZADO' });
    const second = react.deps[TRACKING_EFFECT];

    expect(first).toEqual(second);
    first.forEach((dep, index) => expect(Object.is(dep, second[index])).toBe(true));
  });

  it(`debounce de ${TRACKING_DEBOUNCE_MS} ms: el borrador llega a la URL tras la espera, con entrada en el historial`, () => {
    vi.useFakeTimers();
    const draft = { ...INITIAL_TRACKING_QUERY, filters: { ...INITIAL_TRACKING_QUERY.filters, level: 'AVANZADO' } };
    renderHookWith({ source: source() }, { [DRAFT]: { base: '', query: draft } });

    react.effects[DEBOUNCE_EFFECT]();
    vi.advanceTimersByTime(TRACKING_DEBOUNCE_MS - 1);
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({ search: 'nivel=AVANZADO' });
  });

  it('un cambio antes del plazo reinicia la espera: el borrador anterior no sale', () => {
    vi.useFakeTimers();
    const draft = { ...INITIAL_TRACKING_QUERY, filters: { ...INITIAL_TRACKING_QUERY.filters, level: 'INICIAL' } };
    renderHookWith({ source: source() }, { [DRAFT]: { base: '', query: draft } });

    const cancel = react.effects[DEBOUNCE_EFFECT]();
    vi.advanceTimersByTime(200);
    cancel();
    vi.advanceTimersByTime(TRACKING_DEBOUNCE_MS);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sin borrador no hay espera ni navegación', () => {
    vi.useFakeTimers();
    renderHookWith({ source: source() });

    expect(react.effects[DEBOUNCE_EFFECT]()).toBeUndefined();
    vi.advanceTimersByTime(TRACKING_DEBOUNCE_MS);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('borrador igual a la URL: se descarta sin navegar', () => {
    vi.useFakeTimers();
    renderHookWith({ source: source(), search: '?nivel=AVANZADO' }, {
      [DRAFT]: { base: 'nivel=AVANZADO', query: { ...INITIAL_TRACKING_QUERY, filters: { ...INITIAL_TRACKING_QUERY.filters, level: 'AVANZADO' } } },
    });

    react.effects[DEBOUNCE_EFFECT]();
    vi.advanceTimersByTime(TRACKING_DEBOUNCE_MS);
    expect(navigate).not.toHaveBeenCalled();
    expect(react.setters[DRAFT]).toHaveBeenLastCalledWith(null);
  });

  it('atrás o adelante: un borrador hecho sobre otra URL deja de valer; manda la URL nueva', async () => {
    vi.useFakeTimers();
    const stale = { base: 'alertas=true', query: { ...INITIAL_TRACKING_QUERY, filters: { ...INITIAL_TRACKING_QUERY.filters, level: 'INICIAL' } } };
    const src = source();
    const result = renderHookWith({ source: src, search: '?alertas=false' }, { [DRAFT]: stale });

    expect(result.filters).toMatchObject({ alerts: 'false', level: null });
    expect(react.effects[DEBOUNCE_EFFECT]()).toBeUndefined();
    react.effects[CANONICAL_EFFECT]();
    vi.advanceTimersByTime(TRACKING_DEBOUNCE_MS);
    expect(navigate).not.toHaveBeenCalled();

    react.effects[TRACKING_EFFECT]();
    expect(src.list.mock.calls[0][1].filters.alerts).toBe('false');
  });

  it('el borrador se encadena sobre la misma URL: dos cambios seguidos se combinan', () => {
    const result = renderHookWith({ source: source(), search: '?alertas=true' });
    const pending = { base: 'alertas=true', query: { ...INITIAL_TRACKING_QUERY, filters: { ...INITIAL_TRACKING_QUERY.filters, alerts: 'true', level: 'INICIAL' } } };

    result.setFilter('adherenceMin', '50');
    expect(react.setters[DRAFT].mock.lastCall[0](pending).query.filters).toMatchObject({ alerts: 'true', level: 'INICIAL', adherenceMin: 50 });
    expect(react.setters[DRAFT].mock.lastCall[0]({ ...pending, base: 'otra=1' }).query.filters).toMatchObject({ alerts: 'true', level: null, adherenceMin: 50 });
  });
});
