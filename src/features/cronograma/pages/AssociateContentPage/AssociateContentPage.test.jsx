import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import {
  findAll,
  findByText,
  hookStub,
  renderDirect,
} from '../../test-utils/directRender.js';
import { AssociateContentForm } from '../../components/AssociateContentForm/AssociateContentForm.jsx';
import { ScheduledContentAvailabilityForm } from '../../components/ScheduledContentAvailabilityForm/ScheduledContentAvailabilityForm.jsx';
import { AssociateContentPage } from './AssociateContentPage.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  asociar: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  catalogo: vi.fn(),
  contenidos: vi.fn(),
  associateOptions: null,
  availabilityOptions: null,
  loadAvailability: vi.fn(),
  clearAssociationForm: vi.fn(),
  resetAvailability: vi.fn(),
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useParams: () => ({ scheduleId: 'qa-1', unitId: 'u-1' }),
}));

vi.mock('@/features/cronograma/api/contenidoUnidadTemporal/asociarContenidoUnidadTemporal.jsx', () => ({
  asociarContenidoUnidadTemporal: (...args) => mocks.asociar(...args),
}));
vi.mock('@/features/cronograma/api/contenidoUnidadTemporal/actualizarDisponibilidadContenido.jsx', () => ({
  actualizarDisponibilidadContenido: (...args) => mocks.actualizar(...args),
}));
vi.mock('@/features/cronograma/api/contenidoUnidadTemporal/eliminarAsociacionContenidoUnidadTemporal.jsx', () => ({
  eliminarAsociacionContenidoUnidadTemporal: (...args) => mocks.eliminar(...args),
}));
vi.mock('@/features/cronograma/api/contenido/obtenerCatalogoContenidos.jsx', () => ({
  obtenerCatalogoContenidos: (...args) => mocks.catalogo(...args),
}));
vi.mock('@/features/cronograma/api/contenidoUnidadTemporal/obtenerContenidosUnidadTemporal.jsx', () => ({
  obtenerContenidosUnidadTemporal: (...args) => mocks.contenidos(...args),
}));
vi.mock('@/features/cronograma/api/unidadTemporal/getUnitTemporalByShulde.jsx', () => ({
  getUnitTemporalByShulde: vi.fn(),
}));

// Los hooks de formulario entregan sus envíos: se capturan.
vi.mock('./hooks/useAssociateContentForm.js', () => ({
  useAssociateContentForm: (options) => {
    mocks.associateOptions = options;
    return {
      form: { contentId: '', availableFrom: '', availableUntil: '' },
      errors: {},
      isSubmitting: false,
      handleChange: vi.fn(),
      handleSubmit: vi.fn(),
      clearAssociationForm: mocks.clearAssociationForm,
    };
  },
}));
vi.mock('./hooks/useScheduledContentAvailabilityForm.js', () => ({
  useScheduledContentAvailabilityForm: (options) => {
    mocks.availabilityOptions = options;
    return {
      form: { associationId: '', availableFrom: '', availableUntil: '' },
      errors: {},
      handleChange: vi.fn(),
      handleSubmit: vi.fn(),
      loadAvailability: mocks.loadAvailability,
      resetForm: mocks.resetAvailability,
    };
  },
}));

const UNIT = Object.freeze({
  id: 'u-1',
  name: 'Semana QA',
  order: 1,
  startDate: '2026-11-02T00:00:00.000Z',
  endDate: '2026-11-30T00:00:00.000Z',
  status: 'BLOQUEADA',
});

const CATALOG = Object.freeze([
  { id: 'c-libre', title: 'Libre y listo', type: 'INFORMATIVO', associated: false, ready: true },
  { id: 'c-pendiente', title: 'Sin recursos', type: 'INFORMATIVO', associated: false, ready: false },
  { id: 'c-asociado', title: 'Asociado en otra unidad', type: 'INFORMATIVO', associated: true, ready: true },
  { id: 'c-programado', title: 'Programado aquí', type: 'ACTIVIDAD', associated: false, ready: true },
  { id: 'c-activo', title: 'Activo aquí', type: 'INFORMATIVO', associated: false, ready: true },
]);

const SCHEDULED = Object.freeze([
  { id: 'a-2', contentId: 'c-activo', temporalUnitId: 'u-1', order: 2, availableFrom: '2026-11-03T08:00', availableUntil: '2026-11-04T08:00', status: 'ACTIVO' },
  { id: 'a-1', contentId: 'c-programado', temporalUnitId: 'u-1', order: 1, availableFrom: '2026-11-10T08:00', availableUntil: '2026-11-11T08:00', status: 'PROGRAMADO' },
]);

// Índices de useState en AssociateContentPage.
const S = Object.freeze({
  catalog: 0,
  units: 1,
  scheduled: 2,
  loading: 3,
  loadError: 4,
  success: 5,
  editable: 6,
  editing: 7,
  pendingDelete: 8,
});

const loaded = (extra = {}) => ({
  [S.catalog]: CATALOG,
  [S.units]: [UNIT],
  [S.scheduled]: SCHEDULED,
  [S.loading]: false,
  [S.editable]: true,
  ...extra,
});

const render = (values) => renderDirect(AssociateContentPage, values);
const buttons = (tree, text) => findByText(tree, text, Button);

beforeEach(() => {
  Object.values(mocks).forEach((value) => value?.mockReset?.());
});

describe('Asociar contenidos', () => {
  it('CP-15 solo ofrece contenidos listos, libres y no programados', () => {
    const tree = render(loaded());
    const [form] = findAll(tree, (el) => el.type === AssociateContentForm);

    expect(form.props.contentOptions).toEqual([
      { value: 'c-libre', label: 'Libre y listo' },
    ]);
  });

  it('CP-15 los contenidos sin recursos llevan a completarlos', () => {
    const tree = render(loaded());
    const [complete] = buttons(tree, 'Completar recursos de Sin recursos');

    complete.props.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/app/administrativo/cronograma/contenidos/c-pendiente/recursos',
      {
        state: {
          creationFlow: true,
          returnToAssociation: { scheduleId: 'qa-1', unitId: 'u-1' },
        },
      },
    );
  });

  it('CP-15 asociar convierte las fechas a ISO y conserva el payload', async () => {
    mocks.asociar.mockResolvedValue({});
    mocks.catalogo.mockResolvedValue([]);
    mocks.contenidos.mockResolvedValue({ contenidos: [] });
    render(loaded());

    await mocks.associateOptions.onValidSubmit({
      contentId: 'c-libre',
      availableFrom: '2026-11-05T08:00',
      availableUntil: '2026-11-06T18:30',
    });

    expect(mocks.asociar).toHaveBeenCalledWith({
      contentId: 'c-libre',
      temporalUnitId: 'u-1',
      availableFrom: new Date('2026-11-05T08:00').toISOString(),
      availableUntil: new Date('2026-11-06T18:30').toISOString(),
    });
    expect(mocks.clearAssociationForm).toHaveBeenCalled();
    expect(hookStub.setters[S.success]).toHaveBeenCalledWith(
      'Contenido asociado correctamente a esta unidad temporal.',
    );
  });

  it('CP-15 el formulario recibe la unidad para validar el rango', () => {
    const tree = render(loaded());

    expect(mocks.associateOptions.unit).toEqual(UNIT);
    const [form] = findAll(tree, (el) => el.type === AssociateContentForm);
    expect(form.props.unit.id).toBe('u-1');
  });

  it('CP-15 el orden de los contenidos asociados se conserva', () => {
    const html = renderToStaticMarkup(render(loaded()));

    expect(html.indexOf('Programado aquí')).toBeLessThan(html.indexOf('Activo aquí'));
  });

  it('CP-16 solo el contenido programado se puede editar', () => {
    const tree = render(loaded());
    const [edit, ...rest] = buttons(tree, 'Editar disponibilidad');

    expect(rest).toHaveLength(0);
    edit.props.onClick();
    expect(mocks.loadAvailability).toHaveBeenCalledWith({
      associationId: 'a-1',
      availableFrom: '2026-11-10T08:00',
      availableUntil: '2026-11-11T08:00',
    });
    expect(hookStub.setters[S.editing]).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a-1', contentTitle: 'Programado aquí', temporalUnitName: 'Semana QA' }),
    );
  });

  it('CP-16 guardar disponibilidad conserva la transformación a ISO', async () => {
    mocks.actualizar.mockResolvedValue({});
    mocks.catalogo.mockResolvedValue([]);
    mocks.contenidos.mockResolvedValue({ contenidos: [] });
    render(loaded());

    await mocks.availabilityOptions.onValidSubmit({
      associationId: 'a-1',
      availableFrom: '2026-11-10T09:00',
      availableUntil: '2026-11-11T09:00',
    });

    expect(mocks.actualizar).toHaveBeenCalledWith({
      associationId: 'a-1',
      availableFrom: new Date('2026-11-10T09:00').toISOString(),
      availableUntil: new Date('2026-11-11T09:00').toISOString(),
    });
    expect(mocks.resetAvailability).toHaveBeenCalled();
    expect(hookStub.setters[S.editing]).toHaveBeenCalledWith(null);
  });

  it('CP-16 el formulario de disponibilidad muestra el contenido editado', () => {
    const editing = { ...SCHEDULED[1], contentTitle: 'Programado aquí', temporalUnitName: 'Semana QA' };
    const tree = render(loaded({ [S.editing]: editing }));
    const [form] = findAll(tree, (el) => el.type === ScheduledContentAvailabilityForm);

    expect(form.props.contentTitle).toBe('Programado aquí');
    expect(form.props.temporalUnitName).toBe('Semana QA');

    const html = renderToStaticMarkup(
      <ScheduledContentAvailabilityForm form={{ availableFrom: '', availableUntil: '' }} contentTitle="Programado aquí" />,
    );
    expect(html).toMatch(/id="scheduled-content-available-from"/);
    expect(html).toMatch(/type="datetime-local"/);
  });

  it('CP-17 desvincular exige confirmación', async () => {
    const tree = render(loaded());
    const [unlink] = buttons(tree, 'Desvincular');

    unlink.props.onClick();
    expect(hookStub.setters[S.pendingDelete]).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a-1', contentTitle: 'Programado aquí' }),
    );
    expect(mocks.eliminar).not.toHaveBeenCalled();

    mocks.eliminar.mockResolvedValue({});
    mocks.catalogo.mockResolvedValue([]);
    mocks.contenidos.mockResolvedValue({ contenidos: [] });
    const pending = { ...SCHEDULED[1], contentTitle: 'Programado aquí', temporalUnitName: 'Semana QA' };
    const open = render(loaded({ [S.pendingDelete]: pending }));
    const [confirm] = findAll(open, (el) => el.type === ConfirmationDialog);

    expect(confirm.props.open).toBe(true);
    expect(confirm.props.description).toContain('"Programado aquí" de Semana QA');
    await confirm.props.onConfirm();
    expect(mocks.eliminar).toHaveBeenCalledWith('a-1');
  });

  it('CP-18 un cronograma activo queda en solo lectura', async () => {
    const tree = render(loaded({ [S.editable]: false }));
    const html = renderToStaticMarkup(tree);

    expect(findAll(tree, (el) => el.type === AssociateContentForm)).toHaveLength(0);
    expect(buttons(tree, 'Editar disponibilidad')).toHaveLength(0);
    expect(buttons(tree, 'Desvincular')).toHaveLength(0);
    expect(buttons(tree, 'Completar recursos')).toHaveLength(0);
    expect(html).toContain('Cronograma activo · solo lectura');
    expect(html).toContain('Solo lectura');

    await mocks.associateOptions.onValidSubmit({ contentId: 'c-libre', availableFrom: 'x', availableUntil: 'y' });
    expect(mocks.asociar).not.toHaveBeenCalled();
    expect(hookStub.setters[S.loadError]).toHaveBeenCalledWith(
      'El cronograma está activo. La programación es de solo lectura.',
    );
  });

  it('CP-19 carga, error, unidad inexistente y vacío se distinguen', () => {
    const loading = renderToStaticMarkup(render({}));
    const error = renderToStaticMarkup(
      render({ [S.loading]: false, [S.loadError]: 'No pudimos cargar la información de la unidad y sus contenidos.' }),
    );
    const empty = renderToStaticMarkup(render(loaded({ [S.scheduled]: [] })));

    expect(loading).toMatch(/role="status"[^>]*>Cargando contenidos de la unidad/);
    expect(error).toMatch(/role="alert"[\s\S]*No pudimos cargar la información/);
    expect(error).toContain('Unidad temporal no encontrada');
    expect(empty).toContain('Esta unidad temporal todavía no tiene contenido programado.');
  });

  it('CP-21 un solo h1 y sin <main>', () => {
    const html = renderToStaticMarkup(render(loaded()));

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(html).toContain('Programación editable');
  });
});
