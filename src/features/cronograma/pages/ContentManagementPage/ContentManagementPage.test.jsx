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
import { PsychoeducationalContentCard } from '../../components/PsychoeducationalContentCard/PsychoeducationalContentCard.jsx';
import { PsychoeducationalContentList } from '../../components/PsychoeducationalContentList/PsychoeducationalContentList.jsx';
import { ContentManagementPage } from './ContentManagementPage.jsx';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), eliminar: vi.fn() }));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/features/cronograma/api/contenido/eliminarContenido.jsx', () => ({
  eliminarContenido: (...args) => mocks.eliminar(...args),
}));
vi.mock('@/features/cronograma/api/contenido/obtenerCatalogoContenidos.jsx', () => ({
  obtenerCatalogoContenidos: vi.fn(),
}));

const LIBRE = Object.freeze({
  id: 'c-1', name: 'Craving QA', type: 'INFORMATIVO', associated: false,
  canEdit: true, canDelete: true, resourcesReady: true, resourceCount: 3,
});
const ACTIVO = Object.freeze({
  id: 'c-2', name: 'Contenido activo QA', type: 'ACTIVIDAD', associated: true,
  canEdit: true, canDelete: true, resourcesReady: false, resourceCount: 0,
  temporalUnitName: 'Semana 1', cronogramaName: 'Cronograma QA', cronogramaStatus: 'ACTIVO',
});

// Índices de useState en ContentManagementPage.
const S = Object.freeze({ contents: 0, loading: 1, loadError: 2, pendingDelete: 3 });
const loaded = (extra = {}) => ({ [S.contents]: [LIBRE, ACTIVO], [S.loading]: false, ...extra });
const markup = (values) => renderToStaticMarkup(renderDirect(ContentManagementPage, values));

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.eliminar.mockReset();
});

describe('Catálogo de contenidos', () => {
  it('CP-01 muestra los contenidos recibidos con tipo, preparación y recursos', () => {
    const html = markup(loaded());

    expect(html).toContain('Craving QA</h3>');
    expect(html).toContain('Contenido activo QA</h3>');
    expect(html).toContain('Informativo');
    expect(html).toContain('Listo para programar');
    expect(html).toContain('Pendiente de recursos');
    expect(html).toContain('3 recursos');
    expect(html).toContain('2 contenidos');
  });

  it('CP-01 conserva las reglas de habilitación por contenido', () => {
    const card = (content) => PsychoeducationalContentCard({ content });
    const disabled = (tree, text) => findByText(tree, text, Button)[0].props.disabled;

    expect(disabled(card(LIBRE), 'Editar')).toBe(false);
    expect(disabled(card(ACTIVO), 'Editar')).toBe(true);
    expect(disabled(card(ACTIVO), 'Eliminar')).toBe(true);
    expect(disabled(card({ ...LIBRE, canEdit: false }), 'Ver recursos')).toBe(true);
    expect(renderToStaticMarkup(card(ACTIVO))).toContain('Un cronograma activo no se puede alterar.');
  });

  it('conserva crear, editar y gestionar recursos con su state', () => {
    const tree = renderDirect(ContentManagementPage, loaded());
    const [list] = findAll(tree, (el) => el.type === PsychoeducationalContentList);

    findByText(tree, 'Crear contenido', Button)[0].props.onClick();
    list.props.onEdit(LIBRE);
    list.props.onManageResources(LIBRE);

    expect(mocks.navigate.mock.calls).toEqual([
      ['/app/administrativo/cronograma/contenidos/nuevo'],
      ['/app/administrativo/cronograma/contenidos/c-1/editar', { state: { content: LIBRE } }],
      ['/app/administrativo/cronograma/contenidos/c-1/recursos', { state: { content: LIBRE } }],
    ]);
  });

  it('CP-09 eliminar exige confirmación', async () => {
    const tree = renderDirect(ContentManagementPage, loaded());
    findAll(tree, (el) => el.type === PsychoeducationalContentList)[0].props.onDelete(LIBRE);

    expect(hookStub.setters[S.pendingDelete]).toHaveBeenCalledWith(LIBRE);
    expect(mocks.eliminar).not.toHaveBeenCalled();

    mocks.eliminar.mockResolvedValue({});
    const open = renderDirect(ContentManagementPage, loaded({ [S.pendingDelete]: LIBRE }));
    const [dialog] = findAll(open, (el) => el.type === ConfirmationDialog);

    expect(dialog.props.description).toContain('"Craving QA"');
    await dialog.props.onConfirm();
    expect(mocks.eliminar).toHaveBeenCalledWith('c-1');
  });

  it('CP-17 carga, error y vacío se distinguen', () => {
    const loading = markup({});
    const error = markup({ [S.loading]: false, [S.loadError]: 'No pudimos cargar los contenidos. Intenta nuevamente.' });
    const empty = markup({ [S.loading]: false });

    expect(loading).toMatch(/role="status"[^>]*>Cargando contenidos/);
    expect(error).toMatch(/role="alert"[\s\S]*No pudimos cargar los contenidos/);
    expect(error).not.toContain('No hay contenidos registrados');
    expect(empty).toContain('No hay contenidos registrados');
  });

  it('CP-18 un solo h1, sin <main> y sin colores fijos en las tarjetas', () => {
    const html = markup(loaded());

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(html).not.toMatch(/(green|amber)-\d00/);
  });
});
