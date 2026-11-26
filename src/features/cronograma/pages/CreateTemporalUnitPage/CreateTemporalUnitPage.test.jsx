import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { hookStub, renderDirect } from '../../test-utils/directRender.js';
import { CreateTemporalUnitPage } from './CreateTemporalUnitPage.jsx';
import { useCreateTemporalUnitForm } from './hooks/useCreateTemporalUnitForm.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  location: { state: null },
  listSchedule: vi.fn(),
  crear: vi.fn(),
  formOptions: null,
  formState: {},
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useParams: () => ({ idSchedule: 'qa/1' }),
  useLocation: () => mocks.location,
}));

vi.mock('../../api/cronograma/listSchedule.jsx', () => ({
  listSchedule: (...args) => mocks.listSchedule(...args),
}));

vi.mock('@/features/cronograma/api/unidadTemporal/crearUnidadTemporal.jsx', () => ({
  crearUnidadTemporal: (...args) => mocks.crear(...args),
}));

// La página entrega su envío al hook: se captura para ejecutarlo.
vi.mock('./hooks/useCreateTemporalUnitForm.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCreateTemporalUnitForm: (options) => {
      if (!mocks.formOptions) return actual.useCreateTemporalUnitForm(options);
      mocks.formOptions = options;
      return {
        form: { name: '', startDate: '', endDate: '' },
        errors: {},
        submitError: '',
        isSubmitting: false,
        handleChange: vi.fn(),
        handleSubmit: vi.fn(),
        ...mocks.formState,
      };
    },
  };
});

const SCHEDULE = Object.freeze({ idCronograma: 'qa/1', nombreCronograma: 'Cronograma QA' });
const VALUES = Object.freeze({
  name: 'Semana 1',
  startDate: '2026-11-02',
  endDate: '2026-11-08',
});

function capture(formState = {}) {
  mocks.formOptions = {};
  mocks.formState = formState;
}

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.listSchedule.mockReset();
  mocks.crear.mockReset();
  mocks.location = { state: { schedule: SCHEDULE } };
  mocks.formOptions = null;
  mocks.formState = {};
});

describe('Crear unidad temporal', () => {
  it('CP-08 conserva idSchedule y el payload exacto', async () => {
    capture();
    mocks.listSchedule.mockResolvedValue([{ idCronograma: 'qa/1', estado: 'INACTIVO' }]);
    mocks.crear.mockResolvedValue({});
    renderDirect(CreateTemporalUnitPage);

    await mocks.formOptions.onValidSubmit(VALUES);

    expect(mocks.crear).toHaveBeenCalledWith({
      id_cronograma: 'qa/1',
      nombre: 'Semana 1',
      fecha_inicio: '2026-11-02',
      fecha_fin: '2026-11-08',
    });
    expect(hookStub.setters[0]).toHaveBeenCalledWith(true);
  });

  it('CP-08 conserva las validaciones de nombre y fechas', () => {
    const onValidSubmit = vi.fn();
    const event = { preventDefault: vi.fn() };

    const { handleSubmit } = renderDirect(() =>
      useCreateTemporalUnitForm({ onValidSubmit }),
    );
    handleSubmit(event);
    expect(hookStub.setters[1]).toHaveBeenCalledWith({
      name: 'El nombre es obligatorio.',
      startDate: 'La fecha de inicio es obligatoria.',
      endDate: 'La fecha de fin es obligatoria.',
    });

    const invertidas = renderDirect(
      () => useCreateTemporalUnitForm({ onValidSubmit }),
      { 0: { name: 'QA', startDate: '2026-11-08', endDate: '2026-11-02' } },
    );
    invertidas.handleSubmit(event);
    expect(hookStub.setters[1]).toHaveBeenCalledWith({
      endDate: 'La fecha final no puede ser anterior al inicio.',
    });
    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it('CP-09 no crea la unidad si el cronograma ya está activo', async () => {
    capture();
    mocks.listSchedule.mockResolvedValue([{ idCronograma: 'qa/1', estado: 'ACTIVO' }]);
    renderDirect(CreateTemporalUnitPage);

    await expect(mocks.formOptions.onValidSubmit(VALUES)).rejects.toThrow(
      'El cronograma ya está activo y no admite nuevas unidades.',
    );
    expect(mocks.crear).not.toHaveBeenCalled();
  });

  it('CP-09 tampoco si el cronograma ya no existe', async () => {
    capture();
    mocks.listSchedule.mockResolvedValue([]);
    renderDirect(CreateTemporalUnitPage);

    await expect(mocks.formOptions.onValidSubmit(VALUES)).rejects.toThrow(
      'No se encontró el cronograma. Regresa al panel.',
    );
    expect(mocks.crear).not.toHaveBeenCalled();
  });

  it('CP-10 tras crear vuelve al panel con el schedule en el state', async () => {
    vi.useFakeTimers();
    capture();
    mocks.listSchedule.mockResolvedValue([{ idCronograma: 'qa/1', estado: 'INACTIVO' }]);
    mocks.crear.mockResolvedValue({});
    renderDirect(CreateTemporalUnitPage);

    await mocks.formOptions.onValidSubmit(VALUES);
    vi.advanceTimersByTime(2000);
    vi.useRealTimers();

    expect(mocks.navigate).toHaveBeenCalledWith(
      '/app/administrativo/cronograma/qa%2F1/panel',
      { state: { schedule: SCHEDULE } },
    );
  });

  it('CP-10 la confirmación de éxito se anuncia', () => {
    const html = renderToStaticMarkup(renderDirect(CreateTemporalUnitPage, { 0: true }));

    expect(html).toMatch(/role="status"[\s\S]*Unidad creada con éxito[\s\S]*Redirigiendo al panel/);
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('cancelar conserva el regreso al panel con su state', () => {
    capture();
    const tree = renderDirect(CreateTemporalUnitPage);
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('Regresar al panel del cronograma');
    tree.props.children
      .find((child) => child?.props?.onCancel)
      .props.onCancel();
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/app/administrativo/cronograma/qa%2F1/panel',
      { state: { schedule: SCHEDULE } },
    );
  });

  it('muestra el cronograma de origen y el error del servidor', () => {
    capture({ submitError: 'Revisa los datos.' });
    const html = renderToStaticMarkup(renderDirect(CreateTemporalUnitPage));

    expect(html).toContain('Cronograma QA');
    expect(html).toMatch(/role="alert"[\s\S]*Revisa los datos\./);
  });

  it('sin location.state (recarga) se muestra sin inventar el cronograma', () => {
    mocks.location = { state: null };
    capture();
    const html = renderToStaticMarkup(renderDirect(CreateTemporalUnitPage));

    expect(html).toContain('Nueva unidad temporal</h1>');
    expect(html).not.toContain('Cronograma:');
    expect(html).toContain('id="temporal-unit-name"');
  });

  it('CP-21 un solo h1 y sin <main>', () => {
    capture();
    const html = renderToStaticMarkup(renderDirect(CreateTemporalUnitPage));

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });
});
