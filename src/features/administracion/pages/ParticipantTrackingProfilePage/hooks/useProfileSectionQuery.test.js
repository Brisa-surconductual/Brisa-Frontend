import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SECTION_OUTCOME, SECTION_STATUS } from '../../../types/participantEngagement.js';
import { TRACKING_ACCESS } from '../../../types/participantTracking.js';
import { useNarrativeProgress } from './useNarrativeProgress.js';
import { useNotificationInteraction } from './useNotificationInteraction.js';
import { useProfileSectionQuery } from './useProfileSectionQuery.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial
 * (o el fijado en `react.preset` por posición) con un setter espía;
 * useEffect se guarda para ejecutarlo.
 */
const react = vi.hoisted(() => ({ setters: [], effects: [], preset: {} }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const position = react.setters.length;
    const setter = vi.fn();
    react.setters.push(setter);
    if (position in react.preset) return [react.preset[position], setter];
    return [typeof initial === 'function' ? initial() : initial, setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
}));

// Orden de los useState del hook.
const DATA = 0;
const STATUS = 1;
const LOADING = 2;
const ATTEMPT = 3;

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });

function render(args = {}, hook = useProfileSectionQuery) {
  react.setters = [];
  react.effects = [];
  return hook({ ...REQUEST, enabled: true, ...args });
}

async function load(args) {
  render(args);
  react.effects[0]();
  await vi.waitFor(() => expect(react.setters[LOADING]).toHaveBeenLastCalledWith(false));
}

const lastValue = (position) => react.setters[position].mock.lastCall?.[0];

beforeEach(() => {
  react.setters = [];
  react.effects = [];
  react.preset = {};
});

describe('useProfileSectionQuery', () => {
  it('sin habilitar (ficha denegada, con error o cargando) no consulta ni expone nada', () => {
    const query = vi.fn();
    const result = render({ enabled: false, query, interpret: vi.fn() });

    expect(react.effects[0]()).toBeUndefined();
    expect(query).not.toHaveBeenCalled();
    expect(result).toMatchObject({ data: null, status: null, isLoading: false });
  });

  it('al deshabilitarse oculta un resultado anterior (cambio de participante o ficha recargando)', () => {
    react.preset = { [DATA]: { valor: 1 }, [STATUS]: SECTION_STATUS.READY };

    expect(render({ enabled: false, query: vi.fn(), interpret: vi.fn() })).toMatchObject({ data: null, status: null });
    expect(render({ enabled: true, query: vi.fn(), interpret: vi.fn() }).data).toEqual({ valor: 1 });
  });

  it('consulta con la cohorte y la referencia, interpreta y guarda solo un resultado OK', async () => {
    const query = vi.fn().mockResolvedValue('respuesta');
    const interpret = vi.fn().mockReturnValue({ outcome: SECTION_OUTCOME.OK, data: { valor: 1 } });

    expect(render({ query, interpret }).isLoading).toBe(true);
    await load({ query, interpret });

    expect(query).toHaveBeenCalledWith('c-1', 'ref-1');
    expect(interpret).toHaveBeenCalledWith('respuesta', REQUEST);
    expect(lastValue(STATUS)).toBe(SECTION_STATUS.READY);
    expect(lastValue(DATA)).toEqual({ valor: 1 });
  });

  it.each([
    [SECTION_OUTCOME.EMPTY, SECTION_STATUS.EMPTY],
    [SECTION_OUTCOME.DENIED, SECTION_STATUS.DENIED],
    [SECTION_OUTCOME.INCONSISTENT, SECTION_STATUS.INCONSISTENT],
    [SECTION_OUTCOME.MALFORMED, SECTION_STATUS.ERROR],
  ])('resultado %s: sin datos', async (outcome, status) => {
    await load({ query: vi.fn().mockResolvedValue({}), interpret: () => ({ outcome, data: { filtrado: true } }) });

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(DATA)).toBeNull();
  });

  it.each([
    ['PERMISO_EXPLICITO_REQUERIDO', SECTION_STATUS.PERMISSION_REQUIRED],
    ['MODULO_NO_DISPONIBLE', SECTION_STATUS.UNAVAILABLE],
    ['PARTICIPANTE_NO_ENCONTRADO', SECTION_STATUS.NOT_FOUND],
    [undefined, SECTION_STATUS.ERROR],
  ])('rechazo con código %s', async (code, status) => {
    await load({ query: vi.fn().mockRejectedValue(Object.assign(new Error('no disponible'), { code })), interpret: vi.fn() });

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(DATA)).toBeNull();
  });

  it('ignora la respuesta si la ficha ya se desmontó', async () => {
    let resolve;
    render({ query: () => new Promise((done) => { resolve = done; }), interpret: () => ({ outcome: SECTION_OUTCOME.OK, data: {} }) });

    const cleanup = react.effects[0]();
    cleanup();
    resolve({});
    await new Promise((done) => setTimeout(done, 0));
    expect(react.setters[STATUS]).not.toHaveBeenCalledWith(SECTION_STATUS.READY);
  });

  it('solo consulta: reintentar es la única operación', () => {
    const result = render({ query: vi.fn(), interpret: vi.fn() });

    expect(Object.keys(result).filter((key) => typeof result[key] === 'function')).toEqual(['retry']);
    result.retry();
    expect(react.setters[ATTEMPT]).toHaveBeenCalledTimes(1);
  });
});

describe('Hooks de cada sección: consultas e interpretaciones propias', () => {
  const granted = (body) => ({ access: TRACKING_ACCESS.GRANTED, ...REQUEST, ...body });

  it('useNarrativeProgress consulta M06 e interpreta RF-130', async () => {
    const getNarrative = vi.fn().mockResolvedValue(granted({ narrative: { activePhaseName: 'Fase', achievements: [] }, gamificationLevel: 3 }));
    render({ source: { getNarrative } }, useNarrativeProgress);
    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[LOADING]).toHaveBeenLastCalledWith(false));

    expect(getNarrative).toHaveBeenCalledWith('c-1', 'ref-1');
    expect(lastValue(DATA)).toEqual({ activePhaseName: 'Fase', lastCompletedChapterName: null, achievements: [] });
  });

  it('useNotificationInteraction consulta M07 e interpreta RF-131', async () => {
    const getInteraction = vi.fn().mockResolvedValue(granted({ metrics: { sent: 3 } }));
    render({ source: { getInteraction } }, useNotificationInteraction);
    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[LOADING]).toHaveBeenLastCalledWith(false));

    expect(getInteraction).toHaveBeenCalledWith('c-1', 'ref-1');
    expect(lastValue(DATA).counts.sent).toEqual({ state: 'AVAILABLE', value: 3 });
  });

  it('cada hook expone su dato con nombre propio y sin habilitar no consulta', () => {
    const getNarrative = vi.fn();
    const getInteraction = vi.fn();

    expect(render({ enabled: false, source: { getNarrative } }, useNarrativeProgress)).toMatchObject({ narrative: null, status: null });
    expect(react.effects[0]()).toBeUndefined();
    expect(render({ enabled: false, source: { getInteraction } }, useNotificationInteraction)).toMatchObject({ interaction: null, status: null });
    expect(react.effects[0]()).toBeUndefined();
    expect(getNarrative).not.toHaveBeenCalled();
    expect(getInteraction).not.toHaveBeenCalled();
  });
});
