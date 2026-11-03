import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { findAll, hookStub, renderDirect } from '../../test-utils/directRender.js';
import { BackButton } from '../../components/BackButton/BackButton.jsx';
import { ContentFormPage } from './ContentFormPage.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  location: { state: null },
  params: {},
  crear: vi.fn(),
  actualizar: vi.fn(),
  formOptions: null,
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useLocation: () => mocks.location,
  useParams: () => mocks.params,
}));

vi.mock('@/features/cronograma/api/contenido/crearContenido.jsx', () => ({
  crearContenido: (...args) => mocks.crear(...args),
}));
vi.mock('@/features/cronograma/api/contenido/actualizarContenido.jsx', () => ({
  actualizarContenido: (...args) => mocks.actualizar(...args),
}));

vi.mock('./hooks/usePsychoeducationalContentForm.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    usePsychoeducationalContentForm: (options) => {
      mocks.formOptions = options;
      return actual.usePsychoeducationalContentForm(options);
    },
  };
});

const RETURN = Object.freeze({ scheduleId: 'qa-1', unitId: 'u-1' });
const CONTENT = Object.freeze({ id: 'c-9', name: 'Craving QA', type: 'INFORMATIVO' });
const PAYLOAD = Object.freeze({ name: 'Craving QA', type: 'INFORMATIVO' });

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.crear.mockReset();
  mocks.actualizar.mockReset();
  mocks.location = { state: null };
  mocks.params = {};
});

describe('Formulario de contenido', () => {
  it('CP-02 crear conserva el payload y continúa a recursos', async () => {
    mocks.location = { state: { returnToAssociation: RETURN } };
    mocks.crear.mockResolvedValue({ id_contenido: 'nuevo-1' });
    renderDirect(ContentFormPage);

    await mocks.formOptions.onValidSubmit(PAYLOAD);

    expect(mocks.crear).toHaveBeenCalledWith(PAYLOAD);
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/app/administrativo/cronograma/contenidos/nuevo-1/recursos',
      { state: { creationFlow: true, returnToAssociation: RETURN } },
    );
  });

  it('CP-02 sin identificador del backend no avanza y muestra el error', async () => {
    mocks.crear.mockResolvedValue({});
    renderDirect(ContentFormPage);

    await mocks.formOptions.onValidSubmit(PAYLOAD);

    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(hookStub.setters[1]).toHaveBeenCalledWith(
      'No pudimos crear el contenido. Verifica la información e intenta nuevamente.',
    );
  });

  it('CP-03 editar conserva identificador, valores iniciales y regreso al catálogo', async () => {
    mocks.location = { state: { content: CONTENT, returnToAssociation: RETURN } };
    mocks.params = { contentId: 'c-9' };
    mocks.actualizar.mockResolvedValue({});
    renderDirect(ContentFormPage, {}, { mode: 'edit' });

    expect(hookStub.initials[2]).toEqual({ name: 'Craving QA', type: 'INFORMATIVO' });

    await mocks.formOptions.onValidSubmit({ name: 'Nuevo nombre', type: 'ACTIVIDAD' });

    expect(mocks.actualizar).toHaveBeenCalledWith({ id: 'c-9', name: 'Nuevo nombre', type: 'ACTIVIDAD' });
    // En edición, el regreso es siempre al catálogo (contentFormReturnPath).
    expect(mocks.navigate).toHaveBeenCalledWith('/app/administrativo/cronograma/contenidos');
  });

  it('CP-04 desde la asociación, volver regresa a la unidad temporal', () => {
    mocks.location = { state: { returnToAssociation: RETURN } };
    const tree = renderDirect(ContentFormPage);
    const [back] = findAll(tree, (el) => el.type === BackButton);

    expect(back.props.children).toBe('Volver a la unidad temporal');
    back.props.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/app/administrativo/cronograma/qa-1/unidades/u-1/contenido',
    );
  });

  it('CP-17 editar sin datos muestra el aviso, no un formulario vacío', () => {
    mocks.params = { contentId: 'c-9' };
    const html = renderToStaticMarkup(renderDirect(ContentFormPage, {}, { mode: 'edit' }));

    expect(html).toContain('Contenido no disponible');
    expect(html).toContain('Identificador: c-9.');
    expect(html).not.toContain('<form');
  });

  it('CP-18 y CP-21 un solo h1, sin <main> y campos etiquetados', () => {
    const html = renderToStaticMarkup(renderDirect(ContentFormPage, { 1: 'Error QA' }));

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(html).toMatch(/<label[^>]*for="psychoeducational-content-name"/);
    expect(html).toMatch(/<label[^>]*for="psychoeducational-content-type"/);
    expect(html).toMatch(/role="alert"[\s\S]*Error QA/);
  });
});
