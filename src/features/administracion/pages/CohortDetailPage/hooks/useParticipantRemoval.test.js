import { beforeEach, describe, expect, it, vi } from 'vitest';

import { REMOVAL_ERROR } from '../../../types/participantRemoval.js';
import {
  REMOVAL_ERROR_MESSAGE,
  REMOVAL_STORAGE_ERROR,
} from '../../../utils/participantRemovalMessages.js';
import { useParticipantRemoval } from './useParticipantRemoval.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial
 * (o el fijado en `react.values` por posición) con un setter espía;
 * useEffect se guarda; useRef crea un objeto { current }.
 */
const react = vi.hoisted(() => ({ setters: [], effects: [], values: {}, index: 0 }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const position = react.index;
    react.index += 1;
    const setter = vi.fn();
    react.setters.push(setter);
    return [position in react.values ? react.values[position] : initial, setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
  useRef(initial) {
    return { current: initial };
  },
}));

// Orden de los useState del hook.
const BUSY = 0;
const NOTICE = 1;
const PENDING = 2;

const PARTICIPANT = Object.freeze({ id: 'p-3', cohortId: 'c-1', code: 'X-3', participationStatus: 'ACTIVO' });

function renderHookWith(hook, args, values = {}) {
  react.setters = [];
  react.effects = [];
  react.index = 0;
  react.values = values;
  return hook({ cohortId: 'c-1', cohortName: 'Cohorte de prueba', enabled: true, ...args });
}

const removeWith = (value) => ({ remove: vi.fn().mockResolvedValue(value) });
const lastNotice = () => react.setters[NOTICE].mock.lastCall?.[0];

beforeEach(() => {
  react.values = {};
});

describe('useParticipantRemoval: confirmación', () => {
  it('solicitar abre la confirmación con ese participante, sin tocar la fuente', () => {
    const source = removeWith({ ok: true });
    const result = renderHookWith(useParticipantRemoval, { source });

    result.requestRemoval(PARTICIPANT);

    expect(react.setters[PENDING]).toHaveBeenCalledWith(PARTICIPANT);
    expect(source.remove).not.toHaveBeenCalled();
  });

  it('cancelar (o Escape, que el diálogo convierte en cancelar) cierra sin cambios', () => {
    const source = removeWith({ ok: true });
    const onRemoved = vi.fn();
    const result = renderHookWith(useParticipantRemoval, { source, onRemoved }, { [PENDING]: PARTICIPANT });

    result.cancelRemoval();

    expect(react.setters[PENDING]).toHaveBeenCalledWith(null);
    expect(source.remove).not.toHaveBeenCalled();
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('sin una fuente que admita retirar no hay acción', async () => {
    const source = removeWith({ ok: true });
    const result = renderHookWith(useParticipantRemoval, { source, enabled: false }, { [PENDING]: PARTICIPANT });

    expect(result.canRemove).toBe(false);
    result.requestRemoval(PARTICIPANT);
    expect(react.setters[PENDING]).not.toHaveBeenCalled();
    await result.confirmRemoval();
    expect(source.remove).not.toHaveBeenCalled();
  });

  it('confirmar sin participante pendiente no hace nada', () => {
    const source = removeWith({ ok: true });

    expect(renderHookWith(useParticipantRemoval, { source }).confirmRemoval()).toBeUndefined();
    expect(source.remove).not.toHaveBeenCalled();
  });
});

describe('useParticipantRemoval: aviso de una operación anterior (E10)', () => {
  it('dismissNotice retira el aviso sin tocar la fuente', () => {
    const source = removeWith({ ok: true });
    const result = renderHookWith(useParticipantRemoval, { source }, { [NOTICE]: { tone: 'success', title: 't', message: 'm' } });

    result.dismissNotice();

    expect(lastNotice()).toBeNull();
    expect(source.remove).not.toHaveBeenCalled();
  });
});

describe('useParticipantRemoval: resultado', () => {
  it('éxito: retira por identificador, refleja el cambio y enfoca un aviso temporal', async () => {
    const source = removeWith({ ok: true, removed: PARTICIPANT });
    const onRemoved = vi.fn();
    const result = renderHookWith(useParticipantRemoval, { source, onRemoved }, { [PENDING]: PARTICIPANT });

    await result.confirmRemoval();

    expect(react.setters[PENDING]).toHaveBeenCalledWith(null);
    expect(source.remove).toHaveBeenCalledWith('c-1', 'p-3');
    expect(onRemoved).toHaveBeenCalledWith('p-3');
    expect(lastNotice()).toEqual({
      tone: 'success',
      title: 'Participante retirado temporalmente',
      message: '«X-3» ya no forma parte de «Cohorte de prueba». Los cambios son temporales y no se guardan en el servidor.',
    });
    expect(lastNotice().message).not.toMatch(/registrad|eliminad/i);

    const focus = vi.fn();
    const shown = renderHookWith(useParticipantRemoval, { source }, { [NOTICE]: lastNotice() });
    shown.noticeRef.current = { focus };
    react.effects[0]();
    expect(focus).toHaveBeenCalled();
  });

  it('muestra el proceso en la tarjeta y lo retira al terminar', async () => {
    const result = renderHookWith(useParticipantRemoval, { source: removeWith({ ok: true }) }, { [PENDING]: PARTICIPANT });

    await result.confirmRemoval();

    const updates = react.setters[BUSY].mock.calls.map(([update]) => update);
    expect(updates[0]([])).toEqual(['p-3']);
    expect(updates[1](['p-3'])).toEqual([]);
  });

  it.each([
    [REMOVAL_ERROR.NOT_ASSOCIATED],
    [REMOVAL_ERROR.PARTICIPANT_NOT_FOUND],
    [REMOVAL_ERROR.COHORT_NOT_FOUND],
  ])('%s: no cambia la lista, avisa y vuelve a consultarla', async (error) => {
    const onRemoved = vi.fn();
    const onStale = vi.fn();
    const result = renderHookWith(
      useParticipantRemoval,
      { source: removeWith({ ok: false, error }), onRemoved, onStale },
      { [PENDING]: PARTICIPANT },
    );

    await result.confirmRemoval();

    expect(onRemoved).not.toHaveBeenCalled();
    expect(onStale).toHaveBeenCalledTimes(1);
    expect(lastNotice()).toEqual({ tone: 'warning', title: 'No se retiró al participante', message: REMOVAL_ERROR_MESSAGE[error] });
  });

  it('un error desconocido no recarga ni cambia nada', async () => {
    const onStale = vi.fn();
    const onRemoved = vi.fn();
    const result = renderHookWith(useParticipantRemoval, { source: removeWith({ ok: false, error: 'OTRO' }), onStale, onRemoved }, { [PENDING]: PARTICIPANT });

    await result.confirmRemoval();

    expect(onStale).not.toHaveBeenCalled();
    expect(onRemoved).not.toHaveBeenCalled();
    expect(lastNotice().tone).toBe('warning');
  });

  it('un fallo de la fuente avisa sin cambios parciales', async () => {
    const onRemoved = vi.fn();
    const result = renderHookWith(useParticipantRemoval, { source: { remove: vi.fn().mockRejectedValue(new Error('x')) }, onRemoved }, { [PENDING]: PARTICIPANT });

    await result.confirmRemoval();

    expect(onRemoved).not.toHaveBeenCalled();
    expect(lastNotice()).toEqual({ tone: 'danger', title: 'No se retiró al participante', message: REMOVAL_STORAGE_ERROR });
  });

  it('protege contra el doble clic: un participante en proceso no se retira dos veces', async () => {
    let resolve;
    const source = { remove: vi.fn(() => new Promise((done) => { resolve = done; })) };
    const result = renderHookWith(useParticipantRemoval, { source }, { [PENDING]: PARTICIPANT });

    const first = result.confirmRemoval();
    void result.confirmRemoval();

    expect(source.remove).toHaveBeenCalledTimes(1);
    resolve({ ok: true });
    await first;
  });
});
