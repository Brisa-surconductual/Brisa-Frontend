import { describe, expect, it } from 'vitest';
import { createRoutesFromChildren, matchRoutes } from 'react-router-dom';

import { SchedulePanelPage, CreateTemporalUnitPage, ScheduleManagementPage } from '@/features/cronograma/index.js';
import { USER_ROLE } from '@/features/users/types/authTypes.js';
import { DASHBOARD_SHORTCUTS } from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';

import { AdminLayout } from '../layouts/AdminLayout/index.js';
import { ADMIN_NAV_ITEMS } from '../layouts/AdminLayout/adminNavigation.js';
import { ProtectedLayout } from '../layouts/ProtectedLayout/index.js';
import { StudentLayout } from '../layouts/StudentLayout/index.js';
import { STUDENT_NAV_ITEMS } from '../layouts/StudentLayout/studentNavigation.js';
import { AppRouter } from './AppRouter.jsx';
import { RequireAuth } from './RequireAuth.jsx';

/*
 * AppRouter no usa hooks: se invoca para obtener el árbol
 * <BrowserRouter><Routes>…</Routes></BrowserRouter> y se evalúa
 * con el mismo `matchRoutes` que usa React Router al navegar.
 */
const ROUTES = createRoutesFromChildren(
  AppRouter().props.children.props.children,
);

function match(pathname) {
  return matchRoutes(ROUTES, pathname);
}

function guardRoles(matches) {
  return matches
    .map(({ route }) => route.element)
    .filter((element) => element?.type === RequireAuth)
    .map((element) => element.props.allowedRoles ?? null);
}

function hasProtectedLayout(matches) {
  return matches.some(
    ({ route }) => route.element?.type === ProtectedLayout,
  );
}

function leafPaths(routes, parent = '') {
  return routes.flatMap((route) => {
    const own = route.path ?? '';
    const full = own.startsWith('/')
      ? own
      : [parent, own].filter(Boolean).join('/').replace('//', '/');

    if (route.children?.length) return leafPaths(route.children, full);

    return [route.index ? `${full} (index)` : full];
  });
}

const ADMIN_PATHS = Object.freeze([
  '/app/administrativo',
  '/app/administrativo/cronograma',
  '/app/administrativo/cronograma/crear',
  '/app/administrativo/cronograma/assignar',
  '/app/administrativo/cronograma/nueva',
  '/app/administrativo/cronograma/pausas',
  '/app/administrativo/cronograma/pausas/nueva',
  '/app/administrativo/cronograma/progreso',
  '/app/administrativo/cronograma/progreso/u-1/informacion-temporal',
  '/app/administrativo/cronograma/contenidos',
  '/app/administrativo/cronograma/contenidos/nuevo',
  '/app/administrativo/cronograma/contenidos/c-1/editar',
  '/app/administrativo/cronograma/contenidos/c-1/recursos',
  '/app/administrativo/cronograma/s-1/unidades/u-1/contenido',
  '/app/administrativo/cronograma/s-1/unidades/u-1',
  '/app/administrativo/cronograma/s-1/panel',
  '/app/administrativo/cronograma/s-1/crear-unidad',
  '/app/administrativo/chat/modalidad',
  '/app/administrativo/chat/grupal',
  '/app/administrativo/chat/grupal/f-1',
  '/app/administrativo/chat/arboles',
]);

describe('Rutas administrativas protegidas', () => {
  it.each(ADMIN_PATHS)(
    '%s exige sesión, rol ADMINISTRATIVO y control de inactividad',
    (pathname) => {
      const matches = match(pathname);

      expect(guardRoles(matches)).toEqual([
        null,
        [USER_ROLE.ADMINISTRATIVO],
      ]);
      expect(hasProtectedLayout(matches)).toBe(true);
    },
  );

  it('el panel conserva la ruta, la página y el parámetro idSchedule', () => {
    const leaf = match('/app/administrativo/cronograma/abc-123/panel').at(-1);

    expect(leaf.route.element.type).toBe(SchedulePanelPage);
    expect(leaf.params).toEqual({ idSchedule: 'abc-123' });
  });

  it('crear unidad conserva la ruta, la página y el parámetro idSchedule', () => {
    const leaf = match(
      '/app/administrativo/cronograma/abc-123/crear-unidad',
    ).at(-1);

    expect(leaf.route.element.type).toBe(CreateTemporalUnitPage);
    expect(leaf.params).toEqual({ idSchedule: 'abc-123' });
  });

  it('el detalle de unidad conserva scheduleId y unitId', () =>
    expect(
      match('/app/administrativo/cronograma/s-1/unidades/u-1').at(-1).params,
    ).toEqual({ scheduleId: 's-1', unitId: 'u-1' }));

  it('el listado de cronogramas se declara una sola vez', () => {
    const declarations = leafPaths(ROUTES).filter(
      (path) => path === '/app/administrativo/cronograma',
    );

    expect(declarations).toHaveLength(1);
    expect(
      match('/app/administrativo/cronograma').at(-1).route.element.type,
    ).toBe(ScheduleManagementPage);
  });

  it('ninguna ruta se declara dos veces', () => {
    const paths = leafPaths(ROUTES);

    expect(new Set(paths).size).toBe(paths.length);
  });

  it('ninguna ruta /app queda fuera de ProtectedLayout', () => {
    const appPaths = leafPaths(ROUTES).filter((path) =>
      path.startsWith('/app/'),
    );

    for (const path of appPaths) {
      expect(hasProtectedLayout(match(path)), path).toBe(true);
    }
  });
});

describe('Layout administrativo en el router', () => {
  function layoutChain(pathname) {
    return match(pathname)
      .map(({ route }) => route.element?.type)
      .filter((type) =>
        [ProtectedLayout, RequireAuth, AdminLayout].includes(type),
      );
  }

  it.each(ADMIN_PATHS)(
    '%s: sesión → ProtectedLayout → rol → AdminLayout',
    (pathname) =>
      expect(layoutChain(pathname)).toEqual([
        RequireAuth,
        ProtectedLayout,
        RequireAuth,
        AdminLayout,
      ]),
  );

  it.each(['/app/estudiante', '/app/estudiante/cronograma/contenido-vigente', '/login', '/registro/cuenta'])(
    '%s no usa el layout administrativo',
    (pathname) => expect(layoutChain(pathname)).not.toContain(AdminLayout),
  );

  it('ProtectedLayout aparece una sola vez', () => {
    for (const pathname of ADMIN_PATHS) {
      expect(
        match(pathname).filter(
          ({ route }) => route.element?.type === ProtectedLayout,
        ),
      ).toHaveLength(1);
    }
  });

  it('cada enlace del menú lleva a una ruta administrativa existente', () => {
    for (const { to } of ADMIN_NAV_ITEMS) {
      expect(layoutChain(to.pathname), to.pathname).toContain(AdminLayout);
    }
  });

  it('cada acceso del dashboard lleva a una ruta administrativa protegida', () => {
    for (const { to } of DASHBOARD_SHORTCUTS) {
      expect(layoutChain(to), to).toEqual([
        RequireAuth,
        ProtectedLayout,
        RequireAuth,
        AdminLayout,
      ]);
      expect(match(to).at(-1).route.path, to).not.toBe('*');
    }
  });
});

describe('Layout del estudiante en el router', () => {
  const STUDENT_PATHS = [
    '/app/estudiante',
    '/app/estudiante/cronograma/contenido-vigente',
  ];

  function chain(pathname) {
    return match(pathname)
      .map(({ route }) => route.element?.type)
      .filter((type) =>
        [ProtectedLayout, RequireAuth, StudentLayout, AdminLayout].includes(
          type,
        ),
      );
  }

  it.each(STUDENT_PATHS)(
    '%s: sesión → ProtectedLayout → ESTUDIANTE → StudentLayout',
    (pathname) => {
      expect(chain(pathname)).toEqual([
        RequireAuth,
        ProtectedLayout,
        RequireAuth,
        StudentLayout,
      ]);
      expect(guardRoles(match(pathname))).toEqual([
        null,
        [USER_ROLE.ESTUDIANTE],
      ]);
    },
  );

  it('ninguna ruta administrativa usa el layout del estudiante', () => {
    for (const pathname of ADMIN_PATHS) {
      expect(chain(pathname)).not.toContain(StudentLayout);
    }
  });

  it('cada enlace del estudiante lleva a una ruta existente con su layout', () => {
    for (const { to } of STUDENT_NAV_ITEMS) {
      expect(chain(to)).toContain(StudentLayout);
    }
  });
});

describe('Rutas sin cambios', () => {
  it.each([
    '/app/estudiante',
    '/app/estudiante/cronograma/contenido-vigente',
  ])('%s exige rol ESTUDIANTE y control de inactividad', (pathname) => {
    const matches = match(pathname);

    expect(guardRoles(matches)).toEqual([null, [USER_ROLE.ESTUDIANTE]]);
    expect(hasProtectedLayout(matches)).toBe(true);
  });

  it.each([
    '/',
    '/login',
    '/recuperar',
    '/recuperar/nueva',
    '/registro/cuenta',
    '/registro/consentimiento',
    '/registro/linea-base',
    '/registro/revision',
    '/registro/reconsentimiento',
    '/registro/completado',
  ])('%s sigue siendo pública', (pathname) =>
    expect(guardRoles(match(pathname))).toEqual([]));

  it('conserva exactamente las direcciones declaradas', () =>
    expect(leafPaths(ROUTES).sort()).toEqual(
      [
        '/',
        '/login',
        '/recuperar',
        '/recuperar/nueva',
        '/registro (index)',
        '/registro/cuenta',
        '/registro/consentimiento',
        '/registro/linea-base',
        '/registro/revision',
        '/registro/reconsentimiento',
        '/registro/completado',
        '/app (index)',
        '/app/estudiante',
        '/app/estudiante/chat',
        '/app/estudiante/cronograma/contenido-vigente',
        ...ADMIN_PATHS.map((path) =>
          path
            .replace('/u-1/informacion', '/:participantId/informacion')
            .replace('/c-1/', '/:contentId/')
            .replace('/s-1/unidades/u-1', '/:scheduleId/unidades/:unitId')
            .replace('/s-1/', '/:idSchedule/')
            .replace('/grupal/f-1', '/grupal/:flowId'),
        ),
        '*',
      ].sort(),
    ));
});
