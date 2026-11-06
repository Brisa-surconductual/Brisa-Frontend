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
import { PsychoeducationalResourceCard } from '../../components/PsychoeducationalResourceCard/PsychoeducationalResourceCard.jsx';
import { PsychoeducationalResourceForm } from '../../components/PsychoeducationalResourceForm/PsychoeducationalResourceForm.jsx';
import { PsychoeducationalResourceList } from '../../components/PsychoeducationalResourceList/PsychoeducationalResourceList.jsx';
import { ContentResourcesPage } from './ContentResourcesPage.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  location: { state: null },
  crear: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  reordenar: vi.fn(),
  listar: vi.fn(),
  solicitarUrl: vi.fn(),
  subir: vi.fn(),
  resetForm: vi.fn(),
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
  useParams: () => ({ contentId: 'c-1' }),
}));

vi.mock('@/features/cronograma/api/recursoContenido/crearRecursoContenido.jsx', () => ({
  crearRecursoContenido: (...args) => mocks.crear(...args),
}));
vi.mock('@/features/cronograma/api/recursoContenido/actualizarRecursoContenido.jsx', () => ({
  actualizarRecursoContenido: (...args) => mocks.actualizar(...args),
}));
vi.mock('@/features/cronograma/api/recursoContenido/eliminarRecursoContenido.jsx', () => ({
  eliminarRecursoContenido: (...args) => mocks.eliminar(...args),
}));
vi.mock('@/features/cronograma/api/recursoContenido/reordenarRecursosContenido.jsx', () => ({
  reordenarRecursosContenido: (...args) => mocks.reordenar(...args),
}));
vi.mock('@/features/cronograma/api/recursoContenido/listarRecursosContenido.jsx', () => ({
  listarRecursosContenido: (...args) => mocks.listar(...args),
}));
vi.mock('@/features/cronograma/api/recursoContenido/solicitarUrlSubidaRecurso.jsx', () => ({
  solicitarUrlSubidaRecurso: (...args) => mocks.solicitarUrl(...args),
}));
vi.mock('@/features/cronograma/api/recursoContenido/subirRecursoFirmado.jsx', () => ({
  subirRecursoFirmado: (...args) => mocks.subir(...args),
}));
vi.mock('@/features/cronograma/api/recursoContenido/listarModulosDestino.jsx', () => ({ listarModulosDestino: vi.fn() }));
vi.mock('@/features/cronograma/api/contenido/obtenerCatalogoContenidos.jsx', () => ({ obtenerCatalogoContenidos: vi.fn() }));

vi.mock('./hooks/usePsychoeducationalResourceForm.js', () => ({
  usePsychoeducationalResourceForm: (options) => {
    mocks.formOptions = options;
    return {
      form: { type: '', order: '', textContent: '', storageKey: '', file: null, moduleIds: [] },
      errors: {},
      handleChange: vi.fn(),
      handleFileChange: vi.fn(),
      handleModuleToggle: vi.fn(),
      handleSubmit: vi.fn(),
      resetForm: mocks.resetForm,
    };
  },
}));

const CONTENT = Object.freeze({ id: 'c-1', name: 'Craving QA', type: 'INFORMATIVO', canEdit: true });
const MODULES = Object.freeze([{ id: 'm-1', code: 'M03', name: 'Chat' }]);
const R1 = Object.freeze({ id: 'r-1', order: 1, type: 'TEXTO', textContent: 'Hola', moduleIds: ['m-1'] });
const R2 = Object.freeze({ id: 'r-2', order: 2, type: 'IMAGEN', moduleIds: ['m-1'], storageKey: 'k' });
const FILE = Object.freeze({ type: 'image/png', size: 2048, name: 'qa.png' });
const UPLOAD = Object.freeze({ url_subida: 'https://qa.example/subir', metodo: 'PUT', encabezados: { 'Content-Type': 'image/png' }, clave_almacenamiento: 'clave-qa' });

// Índices de useState en ContentResourcesPage.
const S = Object.freeze({
  content: 0, resources: 1, modules: 2, loading: 3, loadError: 4,
  isSubmitting: 5, submitError: 6, editing: 7, pendingDelete: 8,
});
const ready = (extra = {}) => ({
  [S.content]: CONTENT, [S.resources]: [R1, R2], [S.modules]: MODULES, [S.loading]: false, ...extra,
});
const listOf = (tree) => findAll(tree, (el) => el.type === PsychoeducationalResourceList)[0];

beforeEach(() => {
  Object.values(mocks).forEach((value) => value?.mockReset?.());
  mocks.location = { state: null };
  mocks.listar.mockResolvedValue([]);
});

describe('Recursos del contenido', () => {
  it('CP-05 crear un recurso de texto conserva tipo, orden y destino', async () => {
    renderDirect(ContentResourcesPage, ready());

    await mocks.formOptions.onValidSubmit({ type: 'TEXTO', order: 3, textContent: 'Bloque QA', moduleIds: ['m-1'] });

    expect(mocks.crear).toHaveBeenCalledWith({
      contentId: 'c-1', type: 'TEXTO', order: 3, textContent: 'Bloque QA', moduleIds: ['m-1'],
    });
    expect(mocks.listar).toHaveBeenCalledWith('c-1');
    expect(mocks.resetForm).toHaveBeenCalled();
  });

  it('CP-06 la subida conserva el flujo: URL firmada, subida y registro', async () => {
    mocks.solicitarUrl.mockResolvedValue(UPLOAD);
    renderDirect(ContentResourcesPage, ready());

    await mocks.formOptions.onValidSubmit({ type: 'IMAGEN', order: 3, file: FILE, moduleIds: ['m-1'] });

    expect(mocks.solicitarUrl).toHaveBeenCalledWith({ contentId: 'c-1', type: 'IMAGEN', mimeType: 'image/png', sizeBytes: 2048 });
    expect(mocks.subir).toHaveBeenCalledWith({ uploadUrl: UPLOAD.url_subida, method: 'PUT', headers: UPLOAD.encabezados, file: FILE });
    expect(mocks.crear).toHaveBeenCalledWith({
      contentId: 'c-1', type: 'IMAGEN', order: 3, storageKey: 'clave-qa', mimeType: 'image/png', sizeBytes: 2048, moduleIds: ['m-1'],
    });
    const order = ['solicitarUrl', 'subir', 'crear'].map((key) => mocks[key].mock.invocationCallOrder[0]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('CP-06 si la subida falla no registra el recurso ni lo da por guardado', async () => {
    mocks.solicitarUrl.mockResolvedValue(UPLOAD);
    mocks.subir.mockRejectedValue(new Error('No se pudo subir el recurso. HTTP 500'));
    renderDirect(ContentResourcesPage, ready());

    await mocks.formOptions.onValidSubmit({ type: 'IMAGEN', order: 3, file: FILE, moduleIds: ['m-1'] });

    expect(mocks.crear).not.toHaveBeenCalled();
    expect(mocks.resetForm).not.toHaveBeenCalled();
    expect(hookStub.setters[S.submitError]).toHaveBeenCalledWith('No se pudo subir el recurso. HTTP 500');
  });

  it('CP-07 el ordenamiento envía la nueva secuencia completa', async () => {
    const tree = renderDirect(ContentResourcesPage, ready());

    listOf(tree).props.onMoveDown(R1);
    await vi.waitFor(() => expect(mocks.reordenar).toHaveBeenCalled());

    expect(mocks.reordenar).toHaveBeenCalledWith({ contentId: 'c-1', resourceIds: ['r-2', 'r-1'] });
  });

  it('CP-07 los controles de orden tienen nombre accesible y respetan los límites', () => {
    const html = renderToStaticMarkup(
      <PsychoeducationalResourceList resources={[R2, R1]} destinationModules={MODULES} canManage canReorder />,
    ).replace(/<!-- -->/g, '');

    expect(html.indexOf('Bloque 1')).toBeLessThan(html.indexOf('Bloque 2'));
    expect(html).toMatch(/disabled=""[^>]*aria-label="Subir bloque 1"/);
    expect(html).toMatch(/aria-label="Bajar bloque 1"/);
    expect(html).toMatch(/disabled=""[^>]*aria-label="Bajar bloque 2"/);
  });

  it('CP-08 editar carga el recurso y actualiza con el mismo contrato', async () => {
    const tree = renderDirect(ContentResourcesPage, ready());
    listOf(tree).props.onEdit(R1);

    expect(hookStub.setters[S.editing]).toHaveBeenCalledWith(R1);
    expect(mocks.resetForm).toHaveBeenCalledWith(R1);

    renderDirect(ContentResourcesPage, ready({ [S.editing]: R1 }));
    await mocks.formOptions.onValidSubmit({ type: 'TEXTO', textContent: 'Editado', moduleIds: ['m-1'] });

    expect(mocks.actualizar).toHaveBeenCalledWith({ resourceId: 'r-1', textContent: 'Editado', moduleIds: ['m-1'] });
  });

  it('CP-08 y CP-09 eliminar pide confirmación antes de llamar a la API', async () => {
    const tree = renderDirect(ContentResourcesPage, ready());
    listOf(tree).props.onDelete(R2);

    expect(hookStub.setters[S.pendingDelete]).toHaveBeenCalledWith(R2);
    expect(mocks.eliminar).not.toHaveBeenCalled();

    const open = renderDirect(ContentResourcesPage, ready({ [S.pendingDelete]: R2 }));
    const [dialog] = findAll(open, (el) => el.type === ConfirmationDialog);

    expect(dialog.props.description).toContain('el bloque 2');
    await dialog.props.onConfirm();
    expect(mocks.eliminar).toHaveBeenCalledWith('r-2');
  });

  it('CP-04 el flujo de creación conserva el regreso a la asociación', () => {
    mocks.location = { state: { creationFlow: true, returnToAssociation: { scheduleId: 'qa-1', unitId: 'u-1' } } };
    const tree = renderDirect(ContentResourcesPage, ready());
    const [next] = findByText(tree, 'Continuar y asociar a la unidad', Button);

    expect(next.props.disabled).toBe(false);
    next.props.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith('/app/administrativo/cronograma/qa-1/unidades/u-1/contenido');
  });

  it('sin permiso de gestión no hay formulario y se indica solo consulta', () => {
    const tree = renderDirect(ContentResourcesPage, ready({ [S.content]: { ...CONTENT, canEdit: false } }));
    const html = renderToStaticMarkup(tree);

    expect(findAll(tree, (el) => el.type === PsychoeducationalResourceForm)).toHaveLength(0);
    expect(html).toContain('Solo consulta');
    expect(listOf(tree).props.canManage).toBe(false);
  });

  it('el estado de preparación se muestra con texto', () => {
    expect(renderToStaticMarkup(renderDirect(ContentResourcesPage, ready()))).toContain('Listo para programar');
    expect(
      renderToStaticMarkup(renderDirect(ContentResourcesPage, ready({ [S.resources]: [] }))),
    ).toContain('Pendiente de recursos');
  });

  it('CP-17 carga, error y vacío se distinguen', () => {
    const loading = renderToStaticMarkup(renderDirect(ContentResourcesPage));
    const error = renderToStaticMarkup(
      renderDirect(ContentResourcesPage, { [S.loading]: false, [S.loadError]: 'No pudimos cargar los recursos del contenido. Intenta nuevamente.' }),
    );
    const empty = renderToStaticMarkup(renderDirect(ContentResourcesPage, ready({ [S.resources]: [] })));

    expect(loading).toMatch(/role="status"[^>]*>Cargando contenido y recursos/);
    expect(error).toMatch(/role="alert"[\s\S]*No pudimos cargar los recursos/);
    expect(empty).toContain('No hay recursos registrados');
  });

  it('CP-18 y CP-21 un solo h1, sin <main>, formulario etiquetado', () => {
    const html = renderToStaticMarkup(renderDirect(ContentResourcesPage, ready()));

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(html).toMatch(/<label[^>]*for="psychoeducational-resource-type"/);
    expect(renderToStaticMarkup(
      <PsychoeducationalResourceCard resource={R2} canManage />,
    ).replace(/<!-- -->/g, '')).toMatch(/Editar<span class="sr-only"> bloque 2/);
  });
});
