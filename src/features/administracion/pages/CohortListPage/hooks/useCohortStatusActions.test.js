import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COHORT_TRANSITION } from '../../../services/cohortTransitions.js';
import {
  STATUS_CHANGE_ERROR,
  STATUS_CHANGE_NOT_FOUND_MESSAGE,
  useCohortStatusActions,
} from './useCohortStatusActions.js';

// React mínimo para entorno node: useState devuelve el valor fijado
// por índice (o el inicial) con un setter espía; useRef persiste
// entre invocaciones de la misma prueba (como entre renders).
const react = vi.hoisted(() => ({ values: {}, setters: [], effects: [], refs: [], index: 0, refIndex: 0 }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const index = react.index;
    react.index += 1;
    const setter = vi.fn();
    react.setters[index] = setter;
    return [index in react.values ? react.values[index] : initial, setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
  useRef(initial) {
    const index = react.refIndex;
    react.refIndex += 1;
    react.refs[index] ??= { current: initial };
    return react.refs[index];
  },
}));

const S = Object.freeze({ BUSY: 0, NOTICE: 1, PENDING: 2 });

const DRAFT = Object.freeze({ id: 'c-1', name: 'Cohorte uno', status: 'BORRADOR' });
const ACTIVE = Object.freeze({ id: 'c-2', name: 'Cohorte dos', status: 'ACTIVA' });

function renderHookWith(hook, args, values = {}) {
  react.values = values;
  react.setters = [];
  react.effects = [];
  react.index = 0;
  react.refIndex = 0;
  return hook(args);
}

const run = (args, values) => renderHookWith(useCohortStatusActions, args, values);
const lastNotice = () => react.setters[S.NOTICE].mock.calls.at(-1)[0];

beforeEach(() => {
  react.refs = [];
});

describe('Activar una cohorte', () => {
  it('éxito: refleja la cohorte actualizada y avisa que es temporal', async () => {
    const updated = { ...DRAFT, status: 'ACTIVA' };
    const changeStatus = vi.fn().mockResolvedValue({ ok: true, cohort: updated });
    const onCohortChanged = vi.fn();

    await run({ onCohortChanged, source: { changeStatus } }).requestActivation(DRAFT);

    expect(changeStatus).toHaveBeenCalledWith('c-1', COHORT_TRANSITION.ACTIVATE);
    expect(onCohortChanged).toHaveBeenCalledWith(updated);
    expect(lastNotice()).toEqual({
      tone: 'success',
      title: 'Cohorte activada temporalmente',
      message: '«Cohorte uno» ahora está activa.',
    });
  });

  it('rechazo: no cambia el estado y explica el motivo', async () => {
    const changeStatus = vi.fn().mockResolvedValue({
      ok: false,
      reason: 'SCHEDULE_NOT_ACTIVE',
      message: 'No es posible activar la cohorte porque el cronograma asociado no está activo.',
      cohort: DRAFT,
    });
    const onCohortChanged = vi.fn();

    await run({ onCohortChanged, source: { changeStatus } }).requestActivation(DRAFT);

    expect(onCohortChanged).toHaveBeenCalledWith(DRAFT);
    expect(lastNotice()).toEqual({
      tone: 'warning',
      title: 'No se pudo activar la cohorte',
      message: 'No es posible activar la cohorte porque el cronograma asociado no está activo.',
    });
  });

  it('cohorte inexistente: lo informa sin tocar el listado', async () => {
    const onCohortChanged = vi.fn();
    const changeStatus = vi.fn().mockResolvedValue({ ok: false, reason: 'NOT_FOUND', cohort: null });

    await run({ onCohortChanged, source: { changeStatus } }).requestActivation(DRAFT);

    expect(onCohortChanged).not.toHaveBeenCalled();
    expect(lastNotice().message).toBe(STATUS_CHANGE_NOT_FOUND_MESSAGE);
  });

  it('error de la fuente: no cambia nada, lo informa y libera la cohorte', async () => {
    const onCohortChanged = vi.fn();
    const changeStatus = vi.fn().mockRejectedValue(new Error('x'));

    await run({ onCohortChanged, source: { changeStatus } }).requestActivation(DRAFT);

    expect(onCohortChanged).not.toHaveBeenCalled();
    expect(lastNotice()).toEqual({ tone: 'danger', title: 'No se pudo activar la cohorte', message: STATUS_CHANGE_ERROR });
    expect(react.setters[S.BUSY].mock.calls.at(-1)[0](['c-1'])).toEqual([]);
  });

  it('una acción repetida mientras se procesa solo llama una vez a la fuente', async () => {
    let resolve;
    const changeStatus = vi.fn(() => new Promise((done) => { resolve = done; }));
    const actions = run({ onCohortChanged: vi.fn(), source: { changeStatus } });

    const first = actions.requestActivation(DRAFT);
    await actions.requestActivation(DRAFT);
    resolve({ ok: true, cohort: { ...DRAFT, status: 'ACTIVA' } });
    await first;

    expect(changeStatus).toHaveBeenCalledTimes(1);
  });

  it('marca la cohorte en proceso mientras dura el cambio', async () => {
    const changeStatus = vi.fn().mockResolvedValue({ ok: true, cohort: { ...DRAFT, status: 'ACTIVA' } });
    await run({ onCohortChanged: vi.fn(), source: { changeStatus } }).requestActivation(DRAFT);

    const [add, remove] = react.setters[S.BUSY].mock.calls.map(([update]) => update);
    expect(add([])).toEqual(['c-1']);
    expect(remove(['c-1'])).toEqual([]);
  });
});

describe('Inactivar una cohorte', () => {
  it('pedirlo solo abre la confirmación: no cambia nada todavía', () => {
    const changeStatus = vi.fn();
    run({ onCohortChanged: vi.fn(), source: { changeStatus } }).requestInactivation(ACTIVE);

    expect(react.setters[S.PENDING]).toHaveBeenCalledWith(ACTIVE);
    expect(changeStatus).not.toHaveBeenCalled();
  });

  it('cancelar cierra la confirmación sin modificar datos', () => {
    const changeStatus = vi.fn();
    const onCohortChanged = vi.fn();
    run({ onCohortChanged, source: { changeStatus } }, { [S.PENDING]: ACTIVE }).cancelInactivation();

    expect(react.setters[S.PENDING]).toHaveBeenCalledWith(null);
    expect(changeStatus).not.toHaveBeenCalled();
    expect(onCohortChanged).not.toHaveBeenCalled();
  });

  it('confirmar inactiva la cohorte pendiente y avisa que es temporal', async () => {
    const updated = { ...ACTIVE, status: 'INACTIVA' };
    const changeStatus = vi.fn().mockResolvedValue({ ok: true, cohort: updated });
    const onCohortChanged = vi.fn();

    await run({ onCohortChanged, source: { changeStatus } }, { [S.PENDING]: ACTIVE }).confirmInactivation();

    expect(react.setters[S.PENDING]).toHaveBeenCalledWith(null);
    expect(changeStatus).toHaveBeenCalledWith('c-2', COHORT_TRANSITION.INACTIVATE);
    expect(onCohortChanged).toHaveBeenCalledWith(updated);
    expect(lastNotice().title).toBe('Cohorte inactivada temporalmente');
  });

  it('confirmar sin cohorte pendiente no hace nada', () => {
    const changeStatus = vi.fn();
    run({ onCohortChanged: vi.fn(), source: { changeStatus } }).confirmInactivation();

    expect(changeStatus).not.toHaveBeenCalled();
  });
});

describe('Foco tras el resultado', () => {
  it('lleva el foco al aviso cuando hay un resultado', () => {
    const focus = vi.fn();
    const { noticeRef } = run({ onCohortChanged: vi.fn() }, { [S.NOTICE]: { tone: 'success', title: 't', message: 'm' } });
    noticeRef.current = { focus };

    react.effects[0]();
    expect(focus).toHaveBeenCalled();
  });
});
