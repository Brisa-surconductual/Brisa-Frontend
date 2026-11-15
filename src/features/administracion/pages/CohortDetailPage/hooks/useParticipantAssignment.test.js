import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ASSIGNMENT_ERROR, ASSIGNMENT_ISSUE } from '../../../types/participantAssignment.js';
import {
  ASSIGNMENT_ERROR_MESSAGE,
  ASSIGNMENT_ISSUE_MESSAGE,
  ASSIGNMENT_STORAGE_ERROR,
  CATALOG_LOAD_ERROR,
} from '../../../utils/participantAssignmentMessages.js';
import { useParticipantAssignment } from './useParticipantAssignment.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial
 * (o el fijado en `react.values` por posición) con un setter espía;
 * useEffect se guarda para ejecutarlo; useRef crea un objeto { current }.
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
  useRef(initial) {
    return { current: initial };
  },
}));

// Orden de los useState del hook.
const OPEN = 0;
const CANDIDATES = 1;
const LOADING = 2;
const CATALOG_ERROR = 3;
const SELECTED = 4;
const SELECTION_ERROR = 5;
const ISSUES = 6;
const REQUEST_ERROR = 7;
const SUBMITTING = 8;
const RESULT = 9;
const ATTEMPT = 10;

const CANDIDATES_LIST = Object.freeze([
  Object.freeze({ id: 'k-1', code: 'Z-1', issue: null }),
  Object.freeze({ id: 'k-2', code: 'Z-2', issue: null }),
  Object.freeze({ id: 'k-3', code: 'Z-3', issue: ASSIGNMENT_ISSUE.ALREADY_ASSIGNED }),
]);
const ASSIGNED = Object.freeze([
  Object.freeze({ id: 'k-1', cohortId: 'c-1', code: 'Z-1', participationStatus: 'PENDIENTE_VALIDACION', pendingReasons: ['Motivo.'] }),
]);

function source({ listAvailable, assign } = {}) {
  return {
    listAvailable: listAvailable ?? vi.fn().mockResolvedValue(CANDIDATES_LIST),
    assign: assign ?? vi.fn().mockResolvedValue({ ok: true, assigned: ASSIGNED }),
  };
}

// Ejecuta el hook con estado fijado por posición.
function renderHookWith(hook, args, values = {}) {
  react.setters = [];
  react.effects = [];
  react.index = 0;
  react.values = values;
  return hook({ cohortId: 'c-1', enabled: true, ...args });
}

const lastValue = (position) => react.setters[position].mock.lastCall?.[0];

beforeEach(() => {
  react.values = {};
});

describe('useParticipantAssignment: apertura, catálogo y cierre', () => {
  it('sin una fuente que admita asignar no abre, no consulta ni envía', async () => {
    const src = source();
    const result = renderHookWith(useParticipantAssignment, { enabled: false, source: src }, { [OPEN]: true, [SELECTED]: ['k-1'] });

    expect(result.canAssign).toBe(false);
    result.open();
    expect(react.setters[OPEN]).not.toHaveBeenCalled();
    expect(react.effects[0]()).toBeUndefined();
    await result.submit();
    expect(src.listAvailable).not.toHaveBeenCalled();
    expect(src.assign).not.toHaveBeenCalled();
  });

  it('abrir limpia la solicitud anterior, abre el panel y lleva el foco a su título', () => {
    const result = renderHookWith(useParticipantAssignment, { source: source() });
    const focus = vi.fn();
    result.headingRef.current = { focus };

    result.open();

    expect(react.setters[OPEN]).toHaveBeenCalledWith(true);
    expect(react.setters[SELECTED]).toHaveBeenCalledWith([]);
    expect(react.setters[RESULT]).toHaveBeenCalledWith(null);
    react.effects[1]();
    expect(focus).toHaveBeenCalled();
  });

  it('cerrado no consulta el catálogo', () => {
    const src = source();
    renderHookWith(useParticipantAssignment, { source: src });

    expect(react.effects[0]()).toBeUndefined();
    expect(src.listAvailable).not.toHaveBeenCalled();
  });

  it('abierto consulta el catálogo de la cohorte', async () => {
    const src = source();
    renderHookWith(useParticipantAssignment, { source: src }, { [OPEN]: true });

    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[LOADING]).toHaveBeenLastCalledWith(false));
    expect(src.listAvailable).toHaveBeenCalledWith('c-1');
    expect(lastValue(CANDIDATES)).toBe(CANDIDATES_LIST);
  });

  it('un fallo del catálogo es un error, sin participantes de reemplazo', async () => {
    renderHookWith(useParticipantAssignment, { source: source({ listAvailable: vi.fn().mockRejectedValue(new Error('x')) }) }, { [OPEN]: true });

    react.effects[0]();
    await vi.waitFor(() => expect(lastValue(CATALOG_ERROR)).toBe(CATALOG_LOAD_ERROR));
    expect(lastValue(CANDIDATES)).toEqual([]);
  });

  it('si la cohorte ya no existe lo informa con su mensaje', async () => {
    renderHookWith(useParticipantAssignment, { source: source({ listAvailable: vi.fn().mockResolvedValue(null) }) }, { [OPEN]: true });

    react.effects[0]();
    await vi.waitFor(() =>
      expect(lastValue(REQUEST_ERROR)).toBe(ASSIGNMENT_ERROR_MESSAGE[ASSIGNMENT_ERROR.COHORT_NOT_FOUND]),
    );
  });

  it('separa disponibles y no disponibles según la fuente, con su mensaje', () => {
    const result = renderHookWith(useParticipantAssignment, { source: source() }, { [CANDIDATES]: CANDIDATES_LIST });

    expect(result.available.map(({ code }) => code)).toEqual(['Z-1', 'Z-2']);
    expect(result.unavailable).toEqual([
      { id: 'k-3', code: 'Z-3', issue: ASSIGNMENT_ISSUE.ALREADY_ASSIGNED, message: ASSIGNMENT_ISSUE_MESSAGE[ASSIGNMENT_ISSUE.ALREADY_ASSIGNED] },
    ]);
  });

  it('cancelar cierra sin enviar, limpia la selección y devuelve el foco al botón', () => {
    const src = source();
    const result = renderHookWith(useParticipantAssignment, { source: src }, { [OPEN]: true, [SELECTED]: ['k-1'] });
    const focus = vi.fn();
    result.triggerRef.current = { focus };

    result.cancel();

    expect(react.setters[OPEN]).toHaveBeenCalledWith(false);
    expect(react.setters[SELECTED]).toHaveBeenCalledWith([]);
    expect(src.assign).not.toHaveBeenCalled();
    react.effects[1]();
    expect(focus).toHaveBeenCalled();
  });
});

describe('useParticipantAssignment: selección', () => {
  it('selección individual y múltiple, con el código de cada seleccionado', () => {
    const result = renderHookWith(useParticipantAssignment, { source: source() }, { [CANDIDATES]: CANDIDATES_LIST, [SELECTED]: ['k-1'] });

    result.toggle('k-2');
    expect(lastValue(SELECTED)(['k-1'])).toEqual(['k-1', 'k-2']);
    result.toggle('k-1');
    expect(lastValue(SELECTED)(['k-1'])).toEqual([]);
    expect(result.selected).toEqual([{ id: 'k-1', code: 'Z-1', hasIssue: false }]);
  });

  it('quitar de la selección elimina también su conflicto', () => {
    const result = renderHookWith(useParticipantAssignment, { source: source() }, {
      [SELECTED]: ['k-1', 'k-2'],
      [ISSUES]: [{ participantId: 'k-2', code: 'Z-2', issue: ASSIGNMENT_ISSUE.ALREADY_ASSIGNED }],
    });

    expect(result.selected[1]).toEqual({ id: 'k-2', code: 'Z-2', hasIssue: true });
    result.remove('k-2');
    expect(lastValue(SELECTED)(['k-1', 'k-2'])).toEqual(['k-1']);
    expect(lastValue(ISSUES)).toEqual([]);
    // Sin conflictos pendientes, el aviso de rechazo desaparece.
    expect(react.setters[REQUEST_ERROR]).toHaveBeenLastCalledWith('');
  });

  it('mientras quedan conflictos, el aviso de rechazo se mantiene', () => {
    const result = renderHookWith(useParticipantAssignment, { source: source() }, {
      [SELECTED]: ['k-1', 'k-2'],
      [ISSUES]: [
        { participantId: 'k-1', code: 'Z-1', issue: ASSIGNMENT_ISSUE.ALREADY_ASSIGNED },
        { participantId: 'k-2', code: 'Z-2', issue: ASSIGNMENT_ISSUE.ALREADY_ASSIGNED },
      ],
    });

    result.toggle('k-2');
    expect(lastValue(ISSUES).map(({ participantId }) => participantId)).toEqual(['k-1']);
    expect(react.setters[REQUEST_ERROR]).not.toHaveBeenCalled();
  });
});

describe('useParticipantAssignment: envío', () => {
  it('sin selección muestra el error y no envía nada', async () => {
    const src = source();
    const result = renderHookWith(useParticipantAssignment, { source: src }, { [OPEN]: true });
    const preventDefault = vi.fn();

    await result.submit({ preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(lastValue(SELECTION_ERROR)).toBe(ASSIGNMENT_ERROR_MESSAGE[ASSIGNMENT_ERROR.EMPTY_SELECTION]);
    expect(src.assign).not.toHaveBeenCalled();
  });

  it('asignación satisfactoria: refleja el resultado tal cual, cierra y enfoca el resultado', async () => {
    const src = source();
    const onAssigned = vi.fn();
    const result = renderHookWith(useParticipantAssignment, { source: src, onAssigned }, { [OPEN]: true, [SELECTED]: ['k-1'] });
    const focus = vi.fn();
    result.resultRef.current = { focus };

    await result.submit();

    expect(src.assign).toHaveBeenCalledWith('c-1', ['k-1']);
    expect(onAssigned).toHaveBeenCalledWith(ASSIGNED);
    expect(lastValue(RESULT)).toBe(ASSIGNED);
    expect(lastValue(RESULT)[0].participationStatus).toBe('PENDIENTE_VALIDACION');
    expect(react.setters[OPEN]).toHaveBeenLastCalledWith(false);
    expect(react.setters[SUBMITTING]).toHaveBeenLastCalledWith(false);
    react.effects[1]();
    expect(focus).toHaveBeenCalled();
  });

  it('conflicto: no asigna, lista cada participante con su mensaje y vuelve a consultar el catálogo', async () => {
    const issues = [
      { participantId: 'k-1', code: 'Z-1', issue: ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT },
      { participantId: 'k-9', code: null, issue: ASSIGNMENT_ISSUE.PARTICIPANT_NOT_FOUND },
    ];
    const onAssigned = vi.fn();
    const result = renderHookWith(
      useParticipantAssignment,
      { onAssigned, source: source({ assign: vi.fn().mockResolvedValue({ ok: false, error: ASSIGNMENT_ERROR.CONFLICT, issues }) }) },
      { [OPEN]: true, [SELECTED]: ['k-1', 'k-9'] },
    );

    await result.submit();

    expect(onAssigned).not.toHaveBeenCalled();
    expect(lastValue(ISSUES)).toEqual(issues);
    expect(lastValue(REQUEST_ERROR)).toBe(ASSIGNMENT_ERROR_MESSAGE[ASSIGNMENT_ERROR.CONFLICT]);
    expect(react.setters[ATTEMPT]).toHaveBeenCalled();
    expect(react.setters[OPEN]).not.toHaveBeenCalledWith(false);

    const shown = renderHookWith(useParticipantAssignment, { source: source() }, { [ISSUES]: issues });
    expect(shown.conflicts).toEqual([
      { participantId: 'k-1', code: 'Z-1', message: 'El participante pertenece a otra cohorte activa.' },
      { participantId: 'k-9', code: 'Código no disponible', message: 'El participante seleccionado no existe.' },
    ]);
  });

  it.each([
    ['cohorte inexistente', { ok: false, error: ASSIGNMENT_ERROR.COHORT_NOT_FOUND, issues: [] }, 'La cohorte seleccionada no existe.'],
    ['respuesta desconocida', { ok: false, error: 'OTRO' }, ASSIGNMENT_STORAGE_ERROR],
  ])('%s: muestra el error y no asigna', async (_, response, message) => {
    const onAssigned = vi.fn();
    const result = renderHookWith(useParticipantAssignment, { onAssigned, source: source({ assign: vi.fn().mockResolvedValue(response) }) }, { [SELECTED]: ['k-1'] });

    await result.submit();

    expect(lastValue(REQUEST_ERROR)).toBe(message);
    expect(onAssigned).not.toHaveBeenCalled();
  });

  it('selección vacía rechazada por la fuente se muestra como error de selección', async () => {
    const result = renderHookWith(
      useParticipantAssignment,
      { source: source({ assign: vi.fn().mockResolvedValue({ ok: false, error: ASSIGNMENT_ERROR.EMPTY_SELECTION, issues: [] }) }) },
      { [SELECTED]: ['k-1'] },
    );

    await result.submit();

    expect(lastValue(SELECTION_ERROR)).toBe(ASSIGNMENT_ERROR_MESSAGE[ASSIGNMENT_ERROR.EMPTY_SELECTION]);
  });

  it('un fallo de la fuente muestra el error de almacenamiento sin cambios', async () => {
    const onAssigned = vi.fn();
    const result = renderHookWith(useParticipantAssignment, { onAssigned, source: source({ assign: vi.fn().mockRejectedValue(new Error('x')) }) }, { [SELECTED]: ['k-1'] });

    await result.submit();

    expect(lastValue(REQUEST_ERROR)).toBe(ASSIGNMENT_STORAGE_ERROR);
    expect(onAssigned).not.toHaveBeenCalled();
    expect(react.setters[SUBMITTING]).toHaveBeenLastCalledWith(false);
  });

  it('protege contra el doble envío y no permite cancelar durante el envío', async () => {
    let resolve;
    const assign = vi.fn(() => new Promise((done) => { resolve = done; }));
    const result = renderHookWith(useParticipantAssignment, { source: source({ assign }) }, { [OPEN]: true, [SELECTED]: ['k-1'] });

    const first = result.submit();
    void result.submit();
    result.cancel();

    expect(assign).toHaveBeenCalledTimes(1);
    expect(react.setters[OPEN]).not.toHaveBeenCalledWith(false);

    resolve({ ok: true, assigned: ASSIGNED });
    await first;
    void result.submit();
    expect(assign).toHaveBeenCalledTimes(2);
  });
});
