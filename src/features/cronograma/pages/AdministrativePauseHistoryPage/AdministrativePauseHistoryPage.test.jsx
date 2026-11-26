import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { findAll, hookStub, renderDirect } from '../../test-utils/directRender.js';
import { AdministrativePauseCard } from '../../components/AdministrativePauseCard/AdministrativePauseCard.jsx';
import { AdministrativePauseList } from '../../components/AdministrativePauseList/AdministrativePauseList.jsx';
import { AdministrativePauseHistoryPage } from './AdministrativePauseHistoryPage.jsx';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), anular: vi.fn() }));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/features/cronograma/api/pausasAdministrativas/getAdministrativeBreak', () => ({
  getAdministrativeBreak: vi.fn(),
}));
vi.mock('@/features/cronograma/api/pausasAdministrativas/annularAdministrativeBreal', () => ({
  annularAdministrativeBreak: (...args) => mocks.anular(...args),
}));

const pause = (id, estado) => ({
  idPausaAdministrativa: id,
  idUsuario: `u-${id}`,
  fechaInicio: '2026-11-03T00:00:00.000Z',
  fechaFin: '2026-11-10T00:00:00.000Z',
  motivo: `Motivo QA ${id}`,
  estado,
  correoElectronico: `estudiante.${id}.qa@example.com`,
  correoUsuarioAdministrativo: 'admin.qa@example.com',
});
const PAUSES = Object.freeze([pause('p1', 'ACTIVA'), pause('p2', 'ANULADA'), pause('p3', 'FINALIZADA')]);

// Índices de useState en AdministrativePauseHistoryPage.
const S = Object.freeze({
  selected: 0, pauses: 1, loading: 2, actionError: 3, success: 4, isSubmitting: 5, loadError: 6,
});
const loaded = (extra = {}) => ({ [S.pauses]: PAUSES, [S.loading]: false, ...extra });
const markup = (values) => renderToStaticMarkup(renderDirect(AdministrativePauseHistoryPage, values));

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.anular.mockReset();
});

describe('Historial de pausas', () => {
  it('CP-10 muestra los datos reales de cada pausa', () => {
    const html = markup(loaded());

    expect(html).toContain('estudiante.p1.qa@example.com</h3>');
    expect(html).toContain('2026-11-03 al 2026-11-10');
    expect(html).toContain('Motivo QA p1');
    expect(html).toContain('admin.qa@example.com');
    expect(html).toContain('3 pausas');
  });

  it('CP-10 distingue con texto una pausa activa, anulada y finalizada', () => {
    const html = markup(loaded());

    expect(html).toContain('Activa');
    expect(html).toContain('Anulada');
    expect(html).toContain('Finalizada');
    // Solo la pausa activa ofrece anular.
    expect(html.match(/Anular pausa<span class="sr-only">/g)).toHaveLength(1);
  });

  it('CP-11 anular pide confirmación y conserva el contrato', async () => {
    const tree = renderDirect(AdministrativePauseHistoryPage, loaded());
    findAll(tree, (el) => el.type === AdministrativePauseList)[0].props.onAnnul(PAUSES[0]);

    expect(hookStub.setters[S.selected]).toHaveBeenCalledWith(PAUSES[0]);
    expect(mocks.anular).not.toHaveBeenCalled();

    mocks.anular.mockResolvedValue({});
    const open = renderDirect(AdministrativePauseHistoryPage, loaded({ [S.selected]: PAUSES[0] }));
    const [dialog] = findAll(open, (el) => el.type === ConfirmationDialog);

    expect(dialog.props.open).toBe(true);
    await dialog.props.onConfirm();
    expect(mocks.anular).toHaveBeenCalledWith('u-p1', 'p1');
    expect(hookStub.setters[S.success]).toHaveBeenCalledWith('Pausa administrativa anulada correctamente.');
  });

  it('CP-11 un error al anular se muestra y no marca la pausa como anulada', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.anular.mockRejectedValue({ response: { status: 409, data: { message: 'La pausa ya terminó.' } } });
    const open = renderDirect(AdministrativePauseHistoryPage, loaded({ [S.selected]: PAUSES[0] }));

    await findAll(open, (el) => el.type === ConfirmationDialog)[0].props.onConfirm();

    expect(hookStub.setters[S.pauses]).not.toHaveBeenCalled();
    expect(hookStub.setters[S.actionError]).toHaveBeenCalledWith('La pausa ya terminó.');
    expect(markup(loaded({ [S.actionError]: 'La pausa ya terminó.' }))).toMatch(/role="alert"[\s\S]*La pausa ya terminó\./);
    console.error.mockRestore();
  });

  it('CP-11 mientras se anula, el botón queda deshabilitado', () => {
    const tree = AdministrativePauseCard({ pause: PAUSES[0], disabled: true });

    expect(renderToStaticMarkup(tree)).toMatch(/<button[^>]*disabled=""[\s\S]*Anular pausa/);
  });

  it('CP-17 carga, error y vacío se distinguen', () => {
    const loading = markup({});
    const error = markup({ [S.loading]: false, [S.loadError]: 'No pudimos cargar las pausas administrativas. Intenta nuevamente.' });
    const empty = markup({ [S.loading]: false });

    expect(loading).toMatch(/role="status"[^>]*>Cargando pausas administrativas/);
    expect(error).toMatch(/role="alert"[\s\S]*No pudimos cargar las pausas/);
    expect(error).not.toContain('No hay pausas para mostrar');
    expect(empty).toContain('No hay pausas para mostrar');
  });

  it('CP-18 un solo h1 y sin <main>; registrar conserva la ruta', () => {
    const tree = renderDirect(AdministrativePauseHistoryPage, loaded());
    const html = renderToStaticMarkup(tree);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    findAll(tree, (el) => el.props?.onClick && JSON.stringify(el.props.children ?? '').includes('Registrar pausa'))[0].props.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith('/app/administrativo/cronograma/pausas/nueva');
  });
});
