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
import { EditTemporalUnitDialog } from '../../components/EditTemporalUnitDialog/EditTemporalUnitDialog.jsx';
import { createDialogCancelHandler } from '../../utils/dialogCancel.js';
import { TemporalUnitDetailPage } from './TemporalUnitDetailPage.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  location: { state: null },
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useParams: () => ({ scheduleId: 'qa-1', unitId: 'u-1' }),
  useLocation: () => mocks.location,
}));

vi.mock('../../api/unidadTemporal/updateUnitTemporal', () => ({
  updateUnitTemporal: (...args) => mocks.update(...args),
}));

vi.mock('../../api/unidadTemporal/delelteUnitTemporal', () => ({
  deleteUnitTemporal: (...args) => mocks.remove(...args),
}));

vi.mock('@/features/cronograma/api/contenidoUnidadTemporal/obtenerContenidosUnidadTemporal.jsx', () => ({
  obtenerContenidosUnidadTemporal: vi.fn(),
}));

const UNIT = Object.freeze({
  idUnidadTemporal: 'u-1',
  nombreUnidadTemporal: 'Semana QA',
  orden: 2,
  fechaInicio: '2026-11-02T00:00:00.000Z',
  fechaFin: '2026-11-08T00:00:00.000Z',
  status: 'BLOQUEADA',
});

const CONTENTS = Object.freeze([
  {
    idContenidoCronograma: 'cc-1',
    ordenContenido: 1,
    nombreContenido: 'Contenido QA',
    tipo: 'INFORMATIVO',
    fechaInicioDisponibilidad: '2026-11-02T10:00:00.000Z',
    fechaFinDisponibilidad: '2026-11-03T10:00:00.000Z',
  },
]);

// Índices de useState en TemporalUnitDetailPage.
const S = Object.freeze({
  formError: 0,
  unit: 1,
  editOpen: 2,
  deleteOpen: 3,
  isSubmitting: 4,
  actionError: 5,
  success: 6,
  editForm: 7,
  contents: 8,
  loadingContents: 9,
  contentsError: 10,
});

const loaded = (extra = {}) => ({
  [S.contents]: CONTENTS,
  [S.loadingContents]: false,
  ...extra,
});

const buttonWith = (tree, text) => findByText(tree, text, Button)[0];
const html = (values) => renderToStaticMarkup(renderDirect(TemporalUnitDetailPage, values));

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.update.mockReset();
  mocks.remove.mockReset();
  mocks.location = { state: { unit: UNIT } };
});

describe('Detalle de unidad temporal', () => {
  it('CP-11 muestra nombre, orden, vigencia, estado y contenidos', () => {
    const markup = html(loaded());

    expect(markup).toContain('Semana QA</h1>');
    expect(markup).toMatch(/Orden<\/dt><dd[^>]*>2</);
    expect(markup).toContain('2026-11-02 al 2026-11-08');
    expect(markup).toContain('Bloqueada');
    expect(markup).toContain('Contenido QA');
    expect(markup).toMatch(/Contenidos<\/dt><dd[^>]*>1</);
  });

  it('CP-11 asociar contenido conserva la ruta y el state', () => {
    const tree = renderDirect(TemporalUnitDetailPage, loaded());

    buttonWith(tree, 'Asociar contenido').props.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/app/administrativo/cronograma/qa-1/unidades/u-1/contenido',
      { state: { unit: UNIT } },
    );
  });

  it('CP-12 editar abre el diálogo con los datos de la unidad', () => {
    const tree = renderDirect(TemporalUnitDetailPage, loaded());
    const [dialog] = findAll(tree, (el) => el.type === EditTemporalUnitDialog);

    expect(hookStub.initials[S.editForm]).toEqual({
      nombre: 'Semana QA',
      fecha_inicio: '2026-11-02',
      fecha_fin: '2026-11-08',
    });
    expect(dialog.props.open).toBe(false);

    buttonWith(tree, 'Editar').props.onClick();
    expect(hookStub.setters[S.formError]).toHaveBeenCalledWith('');
    expect(hookStub.setters[S.editOpen]).toHaveBeenCalledWith(true);
  });

  it('CP-12 guardar conserva el payload y actualiza la unidad', async () => {
    mocks.update.mockResolvedValue({});
    const tree = renderDirect(
      TemporalUnitDetailPage,
      loaded({
        [S.editOpen]: true,
        [S.editForm]: { nombre: 'Semana editada', fecha_inicio: '2026-11-03', fecha_fin: '' },
      }),
    );
    const [dialog] = findAll(tree, (el) => el.type === EditTemporalUnitDialog);

    await dialog.props.onSubmit({ preventDefault: vi.fn() });

    expect(mocks.update).toHaveBeenCalledWith({
      idUnidadTemporal: 'u-1',
      nombre: 'Semana editada',
      fecha_inicio: '2026-11-03',
    });
    expect(hookStub.setters[S.unit]).toHaveBeenCalledWith({
      ...UNIT,
      nombreUnidadTemporal: 'Semana editada',
      fechaInicio: '2026-11-03',
    });
    expect(hookStub.setters[S.editOpen]).toHaveBeenCalledWith(false);
  });

  it('CP-12 un rechazo del servidor queda visible en el diálogo', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.update.mockRejectedValue({ response: { status: 400, data: { message: ['Fechas inválidas'] } } });
    const tree = renderDirect(TemporalUnitDetailPage, loaded({ [S.editOpen]: true }));
    const [dialog] = findAll(tree, (el) => el.type === EditTemporalUnitDialog);

    await dialog.props.onSubmit({ preventDefault: vi.fn() });
    expect(hookStub.setters[S.formError]).toHaveBeenCalledWith('Fechas inválidas');
    expect(hookStub.setters[S.editOpen]).not.toHaveBeenCalledWith(false);

    const markup = renderToStaticMarkup(
      <EditTemporalUnitDialog open form={{ nombre: '', fecha_inicio: '', fecha_fin: '' }} error="Fechas inválidas" />,
    );
    expect(markup).toMatch(/role="alert"[\s\S]*Fechas inválidas/);
    console.error.mockRestore();
  });

  it('CP-13 el diálogo de edición tiene semántica accesible', () => {
    const markup = renderToStaticMarkup(
      <EditTemporalUnitDialog
        open
        form={{ nombre: 'Semana QA', fecha_inicio: '2026-11-02', fecha_fin: '2026-11-08' }}
      />,
    );
    const titleId = markup.match(/aria-labelledby="([^"]+)"/)[1];

    expect(markup).toMatch(/^<dialog aria-modal="true"/);
    expect(markup).toContain(`id="${titleId}"`);
    expect(markup).toMatch(new RegExp(`<h2 id="${titleId}"[^>]*>Editar unidad temporal</h2>`));
    expect(markup).toMatch(/<button type="button"[^>]*aria-label="Cerrar edición de la unidad"[^>]*><svg[^>]*lucide-x/);
    expect(markup).toMatch(/<label[^>]*for="edit-unit-name"/);
    expect(markup).toMatch(/<label[^>]*for="edit-unit-start-date"/);
    expect(markup).toMatch(/<label[^>]*for="edit-unit-end-date"/);
    expect(markup).not.toContain('✕');
  });

  it('CP-13 Escape cierra, salvo mientras se guarda', () => {
    const onClose = vi.fn();
    const busyEvent = { preventDefault: vi.fn() };

    createDialogCancelHandler({ isBusy: true, onClose })(busyEvent);
    expect(busyEvent.preventDefault).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    createDialogCancelHandler({ isBusy: false, onClose })({ preventDefault: vi.fn() });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('CP-13 mientras se guarda no se puede cerrar el diálogo', () => {
    const markup = renderToStaticMarkup(
      <EditTemporalUnitDialog open isSubmitting form={{ nombre: 'QA', fecha_inicio: '', fecha_fin: '' }} />,
    );

    expect(markup).toMatch(/aria-label="Cerrar edición de la unidad"[^>]*disabled=""|disabled=""[^>]*aria-label="Cerrar edición de la unidad"/);
    expect(markup).toContain('Guardando cambios...');
  });

  it('CP-13 hay un solo diálogo de edición', () => {
    const tree = renderDirect(TemporalUnitDetailPage, loaded({ [S.editOpen]: true }));

    expect(findAll(tree, (el) => el.type === EditTemporalUnitDialog)).toHaveLength(1);
  });

  it('CP-14 eliminar exige confirmación antes de llamar a la API', async () => {
    const tree = renderDirect(TemporalUnitDetailPage, loaded());

    buttonWith(tree, 'Eliminar').props.onClick();
    expect(hookStub.setters[S.deleteOpen]).toHaveBeenCalledWith(true);
    expect(mocks.remove).not.toHaveBeenCalled();

    mocks.remove.mockResolvedValue({});
    const open = renderDirect(TemporalUnitDetailPage, loaded({ [S.deleteOpen]: true }));
    const [confirm] = findAll(open, (el) => el.type === ConfirmationDialog);

    expect(confirm.props.open).toBe(true);
    expect(confirm.props.confirmText).toBe('Sí, eliminar');
    await confirm.props.onConfirm();
    expect(mocks.remove).toHaveBeenCalledWith('u-1');
    expect(hookStub.setters[S.success]).toHaveBeenCalledWith('Unidad Temporal eliminada correctamente.');
  });

  it('CP-14 tras eliminar, las acciones quedan deshabilitadas', () => {
    const values = loaded({ [S.success]: 'Unidad Temporal eliminada correctamente.' });
    const tree = renderDirect(TemporalUnitDetailPage, values);

    expect(renderToStaticMarkup(tree)).toMatch(/role="status"[\s\S]*eliminada correctamente/);
    for (const label of ['Editar', 'Eliminar', 'Asociar contenido']) {
      expect(buttonWith(tree, label).props.disabled).toBe(true);
    }

    const active = renderDirect(TemporalUnitDetailPage, loaded());
    expect(buttonWith(active, 'Editar').props.disabled).toBe(false);
  });

  it('CP-19 carga, error y vacío de contenidos se distinguen', () => {
    const loading = html({});
    const error = html({ [S.loadingContents]: false, [S.contentsError]: 'No fue posible cargar los contenidos asociados a esta unidad.' });
    const empty = html({ [S.loadingContents]: false });

    expect(loading).toMatch(/role="status"[^>]*>Cargando contenidos asociados/);
    expect(error).toMatch(/role="alert"[\s\S]*No fue posible cargar los contenidos/);
    expect(empty).toContain('Aún no hay contenidos asociados a esta unidad temporal.');
    expect(empty).not.toContain('role="alert"');
  });

  it('CP-19 sin la unidad en el state ofrece volver a cronogramas', () => {
    mocks.location = { state: null };
    const tree = renderDirect(TemporalUnitDetailPage);

    expect(renderToStaticMarkup(tree)).toContain('Unidad no encontrada o datos perdidos.');
    buttonWith(tree, 'Volver a cronogramas').props.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith('/app/administrativo/cronograma');
  });

  it('CP-21 un solo h1 y sin <main>', () => {
    const markup = html(loaded());

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).not.toContain('<main');
  });
});
