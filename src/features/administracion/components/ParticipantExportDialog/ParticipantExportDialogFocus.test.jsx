import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ParticipantExportDialog } from './ParticipantExportDialog.jsx';

/*
 * Comportamiento del <dialog> sin navegador: React mínimo que entrega
 * referencias preparadas (diálogo y «Cancelar») y guarda los efectos para
 * ejecutarlos a mano. El componente se llama como función y se inspeccionan
 * los manejadores del elemento <dialog> que devuelve.
 */
const react = vi.hoisted(() => ({ refs: [], effects: [] }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useEffect(effect) {
    react.effects.push(effect);
  },
  useRef() {
    return react.refs.shift() ?? { current: null };
  },
  useId: () => 'id',
}));

function fakeDialog(open = false) {
  return {
    open,
    showModal: vi.fn(function showModal() { this.open = true; }),
    close: vi.fn(function close() { this.open = false; }),
  };
}

function mount(props = {}, element = fakeDialog()) {
  const cancelButton = { focus: vi.fn() };
  const trigger = { focus: vi.fn() };
  react.refs = [{ current: element }, { current: cancelButton }];
  react.effects = [];
  const handlers = { onCancel: vi.fn(), onConfirm: vi.fn() };
  const tree = ParticipantExportDialog({
    open: true,
    participantCode: 'P-1A2B3C4D',
    returnFocusRef: { current: trigger },
    ...handlers,
    ...props,
  });
  react.effects.forEach((effect) => effect());

  return { tree, element, cancelButton, trigger, ...handlers };
}

const escape = () => ({ preventDefault: vi.fn() });

beforeEach(() => {
  react.refs = [];
  react.effects = [];
});

describe('Modal de la exportación (RF-145): foco y teclado', () => {
  it('al abrir es modal y el foco va a «Cancelar», la opción segura', () => {
    const { element, cancelButton } = mount();

    expect(element.showModal).toHaveBeenCalledTimes(1);
    expect(cancelButton.focus).toHaveBeenCalledTimes(1);
  });

  it('al cerrar devuelve el foco al botón que lo abrió', () => {
    const { element, trigger } = mount({ open: false }, fakeDialog(true));

    expect(element.close).toHaveBeenCalledTimes(1);
    expect(trigger.focus).toHaveBeenCalledTimes(1);
  });

  it('Escape cancela sin ninguna otra acción', () => {
    const { tree, onCancel, onConfirm } = mount();
    const event = escape();

    tree.props.onCancel(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('mientras se genera el archivo, ni Escape ni un clic fuera lo cierran', () => {
    const { tree, element, onCancel } = mount({ exporting: true });
    const event = escape();

    tree.props.onCancel(event);
    tree.props.onClick({ target: element });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('un clic en el fondo cancela; un clic dentro no', () => {
    const { tree, element, onCancel } = mount();

    tree.props.onClick({ target: {} });
    expect(onCancel).not.toHaveBeenCalled();

    tree.props.onClick({ target: element });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
