import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';

import {
  findAll,
  hookStub,
  renderDirect,
} from '../../test-utils/directRender.js';
import { ScheduleOptionList } from '../../components/ScheduleOptionList/ScheduleOptionList.jsx';
import { SearchableUserSelect } from '../../components/SearchableUserSelect/SearchableUserSelect.jsx';
import { getNextActiveIndex } from '../../utils/comboboxNavigation.js';
import { AssignSchedulePage } from './AssignSchedulePage.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  assign: vi.fn(),
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../api/cronograma/assingSchuldeToUser.jsx', () => ({
  assignScheduleToUser: (...args) => mocks.assign(...args),
}));

vi.mock('../../api/cronograma/listSchedule.jsx', () => ({
  listSchedule: vi.fn(),
}));

const SCHEDULES = Object.freeze([
  { idCronograma: 'qa-1', nombreCronograma: 'Cronograma QA', estado: 'INACTIVO', esBase: true },
  { idCronograma: 'qa-2', nombreCronograma: 'Cronograma activo', estado: 'ACTIVO', esBase: false },
]);

// Índices de useState en AssignSchedulePage.
const S = Object.freeze({
  schedules: 0,
  loading: 1,
  loadError: 2,
  userId: 3,
  scheduleId: 4,
  interrumpir: 5,
  isSubmitting: 6,
  submitError: 7,
  success: 8,
});

const loaded = (extra = {}) => ({
  [S.schedules]: SCHEDULES,
  [S.loading]: false,
  ...extra,
});

const formOf = (tree) => findAll(tree, (el) => el.type === 'form')[0];
const submit = (tree) => formOf(tree).props.onSubmit({ preventDefault: vi.fn() });

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.assign.mockReset();
});

describe('Asignar cronograma', () => {
  it('CP-04 conserva el buscador de participantes conectado a la selección', () => {
    const tree = renderDirect(AssignSchedulePage, loaded({ [S.userId]: 'u-1' }));
    const [select] = findAll(tree, (el) => el.type === SearchableUserSelect);

    expect(select.props.value).toBe('u-1');
    expect(select.props.onChange).toBe(hookStub.setters[S.userId]);
  });

  it('CP-04 el buscador es un combobox etiquetado y operable con teclado', () => {
    const html = renderToStaticMarkup(
      <SearchableUserSelect value="" onChange={() => {}} />,
    );

    expect(html).toMatch(/<label for="assign-participant"/);
    expect(html).toMatch(/id="assign-participant"[^>]*role="combobox"[^>]*aria-expanded="false"[^>]*aria-controls="assign-participant-options"/);
    expect(html).toContain('role="listbox"');
    expect(getNextActiveIndex('ArrowDown', -1, 3)).toBe(0);
    expect(getNextActiveIndex('ArrowDown', 2, 3)).toBe(0);
    expect(getNextActiveIndex('ArrowUp', 0, 3)).toBe(2);
    expect(getNextActiveIndex('Enter', 1, 3)).toBe(1);
    expect(getNextActiveIndex('ArrowDown', -1, 0)).toBe(-1);
  });

  it('CP-04 confirma con texto cuando hay participante elegido', () => {
    const html = renderToStaticMarkup(
      <SearchableUserSelect value="u-1" onChange={() => {}} />,
    );

    expect(html).toContain('Participante seleccionado');
  });

  it('CP-05 conserva la selección del cronograma', () => {
    const tree = renderDirect(AssignSchedulePage, loaded({ [S.scheduleId]: 'qa-2' }));
    const [list] = findAll(tree, (el) => el.type === ScheduleOptionList);

    expect(list.props.schedules).toBe(SCHEDULES);
    expect(list.props.selectedId).toBe('qa-2');
    expect(list.props.onSelect).toBe(hookStub.setters[S.scheduleId]);
  });

  it('CP-05 cada cronograma es un radio con nombre, estado e indicador textual', () => {
    const onSelect = vi.fn();
    const list = ScheduleOptionList({ schedules: SCHEDULES, selectedId: 'qa-1', onSelect });
    const radios = findAll(list, (el) => el.type === 'input');

    radios[1].props.onChange();
    expect(onSelect).toHaveBeenCalledWith('qa-2');

    const html = renderToStaticMarkup(list);
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).toMatch(/<input type="radio" id="assign-schedule-0"[^>]*checked=""/);
    expect(html).toContain('Seleccionado');
    expect(html).toContain('Inactivo');
    expect(html).toContain('Activo');
  });

  it('CP-06 interrumpir inicia en true y se actualiza al marcar y desmarcar', () => {
    const tree = renderDirect(AssignSchedulePage, loaded());
    const [checkbox] = findAll(tree, (el) => el.type === Checkbox);

    expect(hookStub.initials[S.interrumpir]).toBe(true);
    expect(checkbox.props.checked).toBe(true);

    checkbox.props.onChange({ target: { checked: false } });
    expect(hookStub.setters[S.interrumpir]).toHaveBeenCalledWith(false);
  });

  it('CP-06 explica la consecuencia de cada valor', () => {
    const on = renderToStaticMarkup(renderDirect(AssignSchedulePage, loaded()));
    const off = renderToStaticMarkup(
      renderDirect(AssignSchedulePage, loaded({ [S.interrumpir]: false })),
    );

    expect(on).toContain('abandonará su cronograma actual inmediatamente');
    expect(on).toContain('Se interrumpirá el cronograma actual');
    expect(off).toContain('El nuevo cronograma esperará al actual');
  });

  it('CP-07 conserva el payload de asignación', async () => {
    mocks.assign.mockResolvedValue({});
    const tree = renderDirect(
      AssignSchedulePage,
      loaded({ [S.userId]: 'u-1', [S.scheduleId]: 'qa-1', [S.interrumpir]: false }),
    );

    await submit(tree);

    expect(mocks.assign).toHaveBeenCalledWith({
      userId: 'u-1',
      scheduleId: 'qa-1',
      interrumpir: false,
    });
    expect(hookStub.setters[S.success]).toHaveBeenCalledWith(
      'El cronograma ha sido asignado correctamente al usuario.',
    );
  });

  it('CP-07 conserva las validaciones de participante y cronograma', async () => {
    const sinUsuario = renderDirect(AssignSchedulePage, loaded({ [S.scheduleId]: 'qa-1' }));
    await submit(sinUsuario);
    expect(hookStub.setters[S.submitError]).toHaveBeenCalledWith('Debes seleccionar un participante.');

    const sinCronograma = renderDirect(AssignSchedulePage, loaded({ [S.userId]: 'u-1' }));
    await submit(sinCronograma);
    expect(hookStub.setters[S.submitError]).toHaveBeenCalledWith('Debes seleccionar un cronograma de la lista.');

    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it('CP-07 conserva la redirección tras asignar', async () => {
    vi.useFakeTimers();
    mocks.assign.mockResolvedValue({});
    const tree = renderDirect(
      AssignSchedulePage,
      loaded({ [S.userId]: 'u-1', [S.scheduleId]: 'qa-1' }),
    );

    await submit(tree);
    vi.advanceTimersByTime(2000);
    vi.useRealTimers();

    expect(mocks.navigate).toHaveBeenCalledWith('/app/administrativo/cronograma');
  });

  it('CP-07 conserva el mensaje de error del servidor', async () => {
    mocks.assign.mockRejectedValue({ response: { data: { message: ['Uno', 'Dos'] } } });
    const tree = renderDirect(
      AssignSchedulePage,
      loaded({ [S.userId]: 'u-1', [S.scheduleId]: 'qa-1' }),
    );

    await submit(tree);
    expect(hookStub.setters[S.submitError]).toHaveBeenCalledWith('Uno, Dos');
  });

  it('el envío se habilita solo con ambas selecciones y se bloquea tras asignar', () => {
    const disabled = (values) =>
      renderToStaticMarkup(renderDirect(AssignSchedulePage, loaded(values))).match(
        /<button[^>]*type="submit"[^>]*disabled=""/,
      ) !== null;

    expect(disabled({})).toBe(true);
    expect(disabled({ [S.userId]: 'u-1', [S.scheduleId]: 'qa-1' })).toBe(false);
    expect(
      disabled({ [S.userId]: 'u-1', [S.scheduleId]: 'qa-1', [S.success]: 'Listo.' }),
    ).toBe(true);
  });

  it('CP-19 carga, error y vacío de cronogramas se distinguen', () => {
    const loading = renderToStaticMarkup(renderDirect(AssignSchedulePage));
    const error = renderToStaticMarkup(
      renderDirect(AssignSchedulePage, { [S.loading]: false, [S.loadError]: 'No se pudieron cargar los cronogramas disponibles.' }),
    );
    const empty = renderToStaticMarkup(
      renderDirect(AssignSchedulePage, { [S.loading]: false }),
    );

    expect(loading).toMatch(/role="status"[^>]*>Cargando cronogramas/);
    expect(error).toMatch(/role="alert"[\s\S]*No se pudieron cargar los cronogramas/);
    expect(empty).toContain('No hay cronogramas creados.');
    expect(empty).not.toContain('role="alert"');
  });

  it('CP-21 tres pasos con h2, un solo h1 y sin <main>', () => {
    const html = renderToStaticMarkup(renderDirect(AssignSchedulePage, loaded()));

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.match(/<h2/g)).toHaveLength(3);
    expect(html).not.toContain('<main');
    expect(html).toContain('Paso 1: </span>Seleccionar participante');
  });
});
