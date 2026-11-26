import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  findAll,
  hookStub,
  renderDirect,
} from '../../test-utils/directRender.js';
import { ScheduleForm } from '../../components/ScheduleForm/ScheduleForm.jsx';
import { CreateSchedulePage } from './CreateSchedulePage.jsx';
import { useCreateScheduleForm } from './hooks/useCreateScheduleForm.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  crearCronograma: vi.fn(),
  formOptions: null,
  useRealForm: true,
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../api/cronograma/crearCronograma', () => ({
  crearCronograma: (...args) => mocks.crearCronograma(...args),
}));

// La página entrega su envío al hook: se captura para ejecutarlo.
vi.mock('./hooks/useCreateScheduleForm.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCreateScheduleForm: (options) => {
      mocks.formOptions = options;
      return actual.useCreateScheduleForm(options);
    },
  };
});

const EMPTY_FORM = { name: '', activationDate: '', isBase: false };

function submitEvent(focus = vi.fn()) {
  return {
    preventDefault: vi.fn(),
    currentTarget: { elements: { namedItem: () => ({ focus }) } },
  };
}

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.crearCronograma.mockReset();
});

describe('Crear cronograma', () => {
  it('CP-01 conserva nombre, fecha de activación y opción base con sus etiquetas', () => {
    const html = renderToStaticMarkup(
      <ScheduleForm form={EMPTY_FORM} errors={{}} />,
    );

    expect(html).toMatch(/<label[^>]*for="schedule-name"/);
    expect(html).toMatch(/<input[^>]*id="schedule-name"[^>]*name="name"/);
    expect(html).toMatch(/type="date" id="schedule-activation-date"[^>]*name="activationDate"/);
    expect(html).toMatch(/<input aria-describedby="schedule-is-base-hint" id="schedule-is-base"[^>]*name="isBase"/);
    expect(html).toContain('El base actual se reemplazará cuando actives este');
  });

  it('CP-01 los errores de validación se muestran con texto asociado al campo', () => {
    const html = renderToStaticMarkup(
      <ScheduleForm
        form={EMPTY_FORM}
        errors={{
          name: 'Ingresa el nombre del cronograma.',
          activationDate: 'Selecciona la fecha de activación.',
        }}
      />,
    );

    expect(html).toMatch(/aria-invalid="true" aria-describedby="schedule-name-error"/);
    expect(html).toMatch(/id="schedule-name-error"[^>]*role="alert">Ingresa el nombre del cronograma\./);
    expect(html).toContain('Selecciona la fecha de activación.');
  });

  it('CP-01 sin datos no envía y enfoca el primer campo inválido', () => {
    const onValidSubmit = vi.fn();
    const focus = vi.fn();
    const { handleSubmit } = renderDirect(
      () => useCreateScheduleForm({ onValidSubmit }),
    );
    const { setters } = hookStub;

    handleSubmit(submitEvent(focus));

    expect(onValidSubmit).not.toHaveBeenCalled();
    expect(setters[1]).toHaveBeenCalledWith({
      name: 'Ingresa el nombre del cronograma.',
      activationDate: 'Selecciona la fecha de activación.',
    });
    expect(focus).toHaveBeenCalled();
  });

  it('CP-01 con datos válidos entrega el nombre recortado', () => {
    const onValidSubmit = vi.fn();
    const { handleSubmit } = renderDirect(
      () => useCreateScheduleForm({ onValidSubmit }),
      { 0: { name: '  Cronograma QA ', activationDate: '2026-11-02', isBase: true } },
    );

    handleSubmit(submitEvent());

    expect(onValidSubmit).toHaveBeenCalledWith({
      name: 'Cronograma QA',
      activationDate: '2026-11-02',
      isBase: true,
    });
  });

  it('CP-02 el payload y la redirección no cambian', async () => {
    mocks.crearCronograma.mockResolvedValue({});
    renderDirect(CreateSchedulePage);

    await mocks.formOptions.onValidSubmit({
      name: 'Cronograma QA',
      activationDate: '2026-11-02',
      isBase: true,
    });

    expect(mocks.crearCronograma).toHaveBeenCalledWith({
      nombre: 'Cronograma QA',
      fecha_activacion: '2026-11-02T00:00:00.000Z',
      es_base: true,
    });
    expect(mocks.navigate).toHaveBeenCalledWith('/app/administrativo/cronograma');
  });

  it('CP-02 un error del servidor se muestra sin redirigir', async () => {
    mocks.crearCronograma.mockRejectedValue({
      response: { data: { message: 'Nombre duplicado.' } },
    });
    renderDirect(CreateSchedulePage);
    const { setters } = hookStub;

    await mocks.formOptions.onValidSubmit({
      name: 'QA',
      activationDate: '2026-11-02',
      isBase: false,
    });

    expect(setters[1]).toHaveBeenCalledWith('Nombre duplicado.');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('CP-03 conserva el bloqueo de doble envío', async () => {
    let resolve;
    mocks.crearCronograma.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    renderDirect(CreateSchedulePage);
    const values = { name: 'QA', activationDate: '2026-11-02', isBase: false };

    const first = mocks.formOptions.onValidSubmit(values);
    await mocks.formOptions.onValidSubmit(values);
    resolve({});
    await first;

    expect(mocks.crearCronograma).toHaveBeenCalledTimes(1);
  });

  it('CP-03 mientras se guarda, el formulario queda bloqueado y lo anuncia', () => {
    const html = renderToStaticMarkup(
      <ScheduleForm form={EMPTY_FORM} isSubmitting />,
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toContain('Creando cronograma...');
  });

  it('CP-21 un solo h1, sin <main> y el error con role="alert"', () => {
    const tree = renderDirect(CreateSchedulePage, { 1: 'Nombre duplicado.' });
    const html = renderToStaticMarkup(tree);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(html).toMatch(/role="alert"[\s\S]*Nombre duplicado\./);
    expect(findAll(tree, (el) => el.type === ScheduleForm)).toHaveLength(1);
  });
});
