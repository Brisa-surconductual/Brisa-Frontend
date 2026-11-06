import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoutesFromChildren, matchRoutes } from 'react-router-dom';

import { AppRouter } from '@/app/router/AppRouter.jsx';
import { RequireAuth } from '@/app/router/RequireAuth.jsx';
import { AdminLayout } from '@/app/layouts/AdminLayout/index.js';
import { USER_ROLE } from '@/features/users/types/authTypes.js';

import { findAll, hookStub, renderDirect } from '../../test-utils/directRender.js';
import { BackButton } from '../../components/BackButton/BackButton.jsx';
import { TemporalInformationPage } from './TemporalInformationPage.jsx';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), ubicacion: vi.fn(), contenido: vi.fn() }));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useParams: () => ({ participantId: 'u-1' }),
}));

vi.mock('@/features/cronograma/api/contenidoVigente/obtenerUbicacionTemporalParticipante.jsx', () => ({
  obtenerUbicacionTemporalParticipante: (...args) => mocks.ubicacion(...args),
}));
vi.mock('@/features/cronograma/api/contenidoVigente/obtenerContenidoVigenteUsuario.jsx', () => ({
  obtenerContenidoVigenteUsuario: (...args) => mocks.contenido(...args),
}));

const RAW = Object.freeze({
  correo_electronico: 'uno.qa@example.com',
  nombre_unidad: 'Semana 2',
  orden_unidad: 2,
  fecha_calculo: '2026-11-02T15:00:00.000Z',
  tiempo_efectivo_transcurrido_segundos: 90000,
  cronograma_finalizado: false,
  mensaje: 'Mensaje QA del backend.',
});
const INFO = Object.freeze({
  participantName: 'uno.qa@example.com',
  temporalUnitName: 'Semana 2',
  temporalUnitOrder: 2,
  calculationDateText: new Date(RAW.fecha_calculo).toLocaleString(),
  elapsedTimeText: '1 d 1 h',
  completed: false,
  message: 'Mensaje QA del backend.',
});

// Índices de useState en TemporalInformationPage.
const S = Object.freeze({ info: 0, contents: 1, loading: 2, loadError: 3 });
const markup = (values) => renderToStaticMarkup(renderDirect(TemporalInformationPage, values));

async function runLoad() {
  renderDirect(TemporalInformationPage);
  hookStub.effects[0]();
  await vi.waitFor(() => expect(hookStub.setters[S.loading]).toHaveBeenCalledWith(false));
}

beforeEach(() => {
  Object.values(mocks).forEach((value) => value.mockReset());
});

describe('Información temporal del participante', () => {
  it('CP-16 conserva los campos y sus transformaciones', async () => {
    mocks.ubicacion.mockResolvedValue(RAW);
    mocks.contenido.mockResolvedValue([]);
    await runLoad();

    expect(mocks.ubicacion).toHaveBeenCalledWith('u-1');
    expect(mocks.contenido).toHaveBeenCalledWith('u-1');
    expect(hookStub.setters[S.info]).toHaveBeenCalledWith(INFO);
  });

  it('CP-16 muestra el resumen, el estado y el contenido vigente', () => {
    const html = markup({
      [S.info]: INFO,
      [S.loading]: false,
      [S.contents]: [{ id: 'c-1', associationId: 'a-1', name: 'Contenido vigente QA', type: 'INFORMATIVO' }],
    });

    expect(html).toContain('uno.qa@example.com</h2>');
    expect(html).toContain('En curso');
    expect(html).toContain('Semana 2');
    expect(html).toContain('1 d 1 h');
    expect(html).toContain('Mensaje QA del backend.');
    expect(html).toContain('Contenido vigente QA');
    expect(markup({ [S.info]: { ...INFO, completed: true }, [S.loading]: false })).toContain('Completado');
  });

  it('CP-17 un 404 es vacío; otros fallos son error', async () => {
    mocks.ubicacion.mockRejectedValue({ response: { status: 404 } });
    mocks.contenido.mockResolvedValue([]);
    await runLoad();
    expect(hookStub.setters[S.loadError]).not.toHaveBeenCalled();

    mocks.ubicacion.mockRejectedValue({ response: { status: 500 } });
    await runLoad();
    expect(hookStub.setters[S.loadError]).toHaveBeenCalledWith(
      'No pudimos consultar la información temporal del participante.',
    );
  });

  it('CP-17 carga, error, sin información y sin contenido se distinguen', () => {
    expect(markup({})).toMatch(/role="status"[^>]*>Cargando información del participante/);
    expect(markup({ [S.loading]: false, [S.loadError]: 'No pudimos consultar la información temporal del participante.' }))
      .toMatch(/role="alert"[\s\S]*No pudimos consultar/);
    expect(markup({ [S.loading]: false })).toContain('No hay información temporal disponible');
    expect(markup({ [S.info]: INFO, [S.loading]: false })).toContain('No hay contenido vigente');
  });

  it('regresa al progreso', () => {
    const tree = renderDirect(TemporalInformationPage);
    findAll(tree, (el) => el.type === BackButton)[0].props.onClick();

    expect(mocks.navigate).toHaveBeenCalledWith('/app/administrativo/cronograma/progreso');
  });

  it('CP-18 un solo h1 y sin <main>', () => {
    const html = markup({ [S.info]: INFO, [S.loading]: false });

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });
});

describe('Permisos administrativos (CP-19)', () => {
  const routes = createRoutesFromChildren(AppRouter().props.children.props.children);
  const PATHS = [
    '/app/administrativo/cronograma/contenidos',
    '/app/administrativo/cronograma/contenidos/nuevo',
    '/app/administrativo/cronograma/contenidos/c-1/editar',
    '/app/administrativo/cronograma/contenidos/c-1/recursos',
    '/app/administrativo/cronograma/pausas',
    '/app/administrativo/cronograma/pausas/nueva',
    '/app/administrativo/cronograma/progreso',
    '/app/administrativo/cronograma/progreso/u-1/informacion-temporal',
  ];

  it.each(PATHS)('%s sigue protegida para el rol administrativo', (path) => {
    const matches = matchRoutes(routes, path);
    const roles = matches
      .map(({ route }) => route.element)
      .filter((element) => element?.type === RequireAuth)
      .map((element) => element.props.allowedRoles ?? null);

    expect(roles).toContainEqual([USER_ROLE.ADMINISTRATIVO]);
    expect(matches.some(({ route }) => route.element?.type === AdminLayout)).toBe(true);
  });
});
