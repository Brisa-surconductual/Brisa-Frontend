import { describe, expect, it } from 'vitest';
import { createRoutesFromChildren, matchRoutes } from 'react-router-dom';

import { SchedulePanelPage, CreateTemporalUnitPage, ScheduleManagementPage } from '@/features/cronograma/index.js';
import {
  AuditLogPage,
  CohortDetailPage,
  CohortFormPage,
  CohortListPage,
  ParticipantTrackingPage,
  ParticipantTrackingProfilePage,
  CohortAggregatePage,
  CohortNarrativePage,
  CohortNotificationsPage,
  CohortDashboard,
  CohortEvolutionPage,
  ParticipantSessionsPage,
  SessionTraceabilityPage,
} from '@/features/administracion/index.js';
import { USER_ROLE } from '@/features/users/types/authTypes.js';
import { DASHBOARD_SHORTCUTS } from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';

import { AdminLayout } from '../layouts/AdminLayout/index.js';
import {
  ADMIN_NAV_ITEMS,
  ADMIN_SECTION,
  getActiveAdminSection,
} from '../layouts/AdminLayout/adminNavigation.js';
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
  '/app/administrativo/cohortes',
  '/app/administrativo/cohortes/nueva',
  '/app/administrativo/cohortes/co-1',
  '/app/administrativo/cohortes/co-1/editar',
  '/app/administrativo/cohortes/co-1/seguimiento',
  '/app/administrativo/cohortes/co-1/seguimiento/P-7F3A91C2',
  '/app/administrativo/cohortes/co-1/vista-agregada',
  '/app/administrativo/cohortes/co-1/vista-narrativa',
  '/app/administrativo/cohortes/co-1/vista-notificaciones',
  '/app/administrativo/cohortes/co-1/evolucion',
  '/app/administrativo/cohortes/co-1/alertas/pendientes',
  '/app/administrativo/auditoria',
  '/app/administrativo/chat/modalidad',
  '/app/administrativo/chat/grupal',
  '/app/administrativo/chat/grupal/f-1',
  '/app/administrativo/chat/arboles',
  '/app/administrativo/chat/variables',
  '/app/administrativo/chat/participantes/P-1A2B3C4D/sesiones',
  '/app/administrativo/chat/participantes/P-1A2B3C4D/sesiones/00000000-0000-4000-8000-000000000001/trazabilidad',
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

  it('RF-38: las sesiones y la trazabilidad montan su página con código A7 e id de sesión', () => {
    const sessions = match('/app/administrativo/chat/participantes/P-1A2B3C4D/sesiones').at(-1);
    const trace = match(
      '/app/administrativo/chat/participantes/P-1A2B3C4D/sesiones/00000000-0000-4000-8000-000000000001/trazabilidad',
    ).at(-1);

    expect(sessions.route.element.type).toBe(ParticipantSessionsPage);
    expect(sessions.params).toEqual({ codigoParticipante: 'P-1A2B3C4D' });
    expect(trace.route.element.type).toBe(SessionTraceabilityPage);
    expect(trace.params).toEqual({
      codigoParticipante: 'P-1A2B3C4D',
      idSesion: '00000000-0000-4000-8000-000000000001',
    });
  });

  it('el listado de cohortes (M08) se declara una sola vez y monta su página', () => {
    const declarations = leafPaths(ROUTES).filter(
      (path) => path === '/app/administrativo/cohortes',
    );

    expect(declarations).toHaveLength(1);
    expect(
      match('/app/administrativo/cohortes').at(-1).route.element.type,
    ).toBe(CohortListPage);
  });

  it('crear y editar cohortes montan el formulario en su modo, con idCohorte', () => {
    const create = match('/app/administrativo/cohortes/nueva').at(-1);
    const edit = match('/app/administrativo/cohortes/demo-temporal-1/editar').at(-1);

    expect(create.route.element.type).toBe(CohortFormPage);
    expect(create.route.element.props.mode).toBeUndefined();
    expect(edit.route.element.type).toBe(CohortFormPage);
    expect(edit.route.element.props.mode).toBe('edit');
    expect(edit.params).toEqual({ idCohorte: 'demo-temporal-1' });
  });

  it('el detalle de cohorte (RF-125) monta su página con idCohorte, sin capturar «nueva»', () => {
    const detail = match('/app/administrativo/cohortes/demo-temporal-1').at(-1);

    expect(detail.route.element.type).toBe(CohortDetailPage);
    expect(detail.params).toEqual({ idCohorte: 'demo-temporal-1' });
    expect(match('/app/administrativo/cohortes/nueva').at(-1).route.element.type).toBe(CohortFormPage);
    expect(
      match('/app/administrativo/cohortes/demo-temporal-1/editar').at(-1).route.element.type,
    ).toBe(CohortFormPage);
  });

  it('el seguimiento por cohorte (RF-142) monta su página con idCohorte y mantiene Cohortes activa', () => {
    const leaf = match('/app/administrativo/cohortes/demo-cohorte-b/seguimiento').at(-1);

    expect(leaf.route.element.type).toBe(ParticipantTrackingPage);
    expect(leaf.params).toEqual({ idCohorte: 'demo-cohorte-b' });
    expect(getActiveAdminSection('/app/administrativo/cohortes/demo-cohorte-b/seguimiento')).toBe(
      ADMIN_SECTION.COHORTES,
    );
    expect(ADMIN_NAV_ITEMS.map(({ label }) => label)).not.toContain('Seguimiento');
  });

  it('la vista agregada conductual (RF-132) monta su página con idCohorte y mantiene Cohortes activa, sin menú propio', () => {
    const leaf = match('/app/administrativo/cohortes/demo-cohorte-b/vista-agregada').at(-1);

    expect(leaf.route.element.type).toBe(CohortAggregatePage);
    expect(leaf.params).toEqual({ idCohorte: 'demo-cohorte-b' });
    expect(getActiveAdminSection('/app/administrativo/cohortes/demo-cohorte-b/vista-agregada')).toBe(
      ADMIN_SECTION.COHORTES,
    );
    expect(ADMIN_NAV_ITEMS.map(({ label }) => label)).not.toContain('Vista agregada');
    expect(match('/app/administrativo/cohortes/demo-cohorte-b/seguimiento').at(-1).route.element.type).toBe(
      ParticipantTrackingPage,
    );
  });

  it('la vista narrativa agregada (RF-133) monta su página con idCohorte y mantiene Cohortes activa, sin menú propio ni alterar RF-132', () => {
    const leaf = match('/app/administrativo/cohortes/demo-cohorte-b/vista-narrativa').at(-1);

    expect(leaf.route.element.type).toBe(CohortNarrativePage);
    expect(leaf.params).toEqual({ idCohorte: 'demo-cohorte-b' });
    expect(getActiveAdminSection('/app/administrativo/cohortes/demo-cohorte-b/vista-narrativa')).toBe(
      ADMIN_SECTION.COHORTES,
    );
    expect(ADMIN_NAV_ITEMS.map(({ label }) => label)).not.toContain('Progresión narrativa');
    expect(match('/app/administrativo/cohortes/demo-cohorte-b/vista-agregada').at(-1).route.element.type).toBe(
      CohortAggregatePage,
    );
  });

  it('la vista de efectividad de notificaciones (RF-134) monta su página con idCohorte y mantiene Cohortes activa, sin menú propio ni alterar RF-132 ni RF-133', () => {
    const leaf = match('/app/administrativo/cohortes/demo-cohorte-b/vista-notificaciones').at(-1);

    expect(leaf.route.element.type).toBe(CohortNotificationsPage);
    expect(leaf.params).toEqual({ idCohorte: 'demo-cohorte-b' });
    expect(getActiveAdminSection('/app/administrativo/cohortes/demo-cohorte-b/vista-notificaciones')).toBe(
      ADMIN_SECTION.COHORTES,
    );
    expect(ADMIN_NAV_ITEMS.map(({ label }) => label)).not.toContain('Notificaciones');
    expect(match('/app/administrativo/cohortes/demo-cohorte-b/vista-agregada').at(-1).route.element.type).toBe(
      CohortAggregatePage,
    );
    expect(match('/app/administrativo/cohortes/demo-cohorte-b/vista-narrativa').at(-1).route.element.type).toBe(
      CohortNarrativePage,
    );
  });

  it('el Dashboard monta el panel de la cohorte activa (RF-140) en la pantalla de aterrizaje, sin ruta ni menú nuevos', () => {
    const leaf = match('/app/administrativo').at(-1);

    expect(leaf.route.element.props.cohortDashboard.type).toBe(CohortDashboard);
    expect(getActiveAdminSection('/app/administrativo')).toBe(ADMIN_SECTION.DASHBOARD);
    expect(ADMIN_NAV_ITEMS.filter(({ label }) => label === 'Dashboard')).toHaveLength(1);
    expect(ADMIN_NAV_ITEMS.map(({ label }) => label)).not.toContain('Panel principal');
  });

  it('la evolución temporal (RF-141) monta su página con idCohorte, mantiene Cohortes activa y no añade menú', () => {
    const leaf = match('/app/administrativo/cohortes/demo-cohorte-b/evolucion').at(-1);

    expect(leaf.route.element.type).toBe(CohortEvolutionPage);
    expect(leaf.params).toEqual({ idCohorte: 'demo-cohorte-b' });
    expect(getActiveAdminSection('/app/administrativo/cohortes/demo-cohorte-b/evolucion')).toBe(
      ADMIN_SECTION.COHORTES,
    );
    expect(ADMIN_NAV_ITEMS.map(({ label }) => label)).not.toContain('Evolución temporal');
  });

  it('la ficha individual (RF-128) monta su página con idCohorte y el código del participante, y mantiene Cohortes activa', () => {
    const leaf = match('/app/administrativo/cohortes/demo-cohorte-b/seguimiento/P-7F3A91C2').at(-1);

    expect(leaf.route.element.type).toBe(ParticipantTrackingProfilePage);
    expect(leaf.params).toEqual({ idCohorte: 'demo-cohorte-b', codigoParticipante: 'P-7F3A91C2' });
    expect(getActiveAdminSection('/app/administrativo/cohortes/demo-cohorte-b/seguimiento/P-7F3A91C2')).toBe(
      ADMIN_SECTION.COHORTES,
    );
    expect(match('/app/administrativo/cohortes/demo-cohorte-b/seguimiento').at(-1).route.element.type).toBe(
      ParticipantTrackingPage,
    );
  });

  it('la auditoría (RF-123) se declara una sola vez y monta su página', () => {
    const declarations = leafPaths(ROUTES).filter(
      (path) => path === '/app/administrativo/auditoria',
    );

    expect(declarations).toHaveLength(1);
    expect(match('/app/administrativo/auditoria').at(-1).route.element.type).toBe(AuditLogPage);
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
    // RF-43: la intervención SOS solo existe para el estudiante.
    '/app/estudiante/sos',
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

  it('RF-43: la intervención SOS no existe en el área administrativa ni sin sesión', () => {
    expect(chain('/app/administrativo/sos')).not.toContain(StudentLayout);
    expect(match('/app/administrativo/sos').at(-1).route.path).toBe('*');
    expect(match('/sos').at(-1).route.path).toBe('*');
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
    '/splash',
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
        '/splash',
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
        '/app/estudiante/chat/sesion/:idSesion',
        '/app/estudiante/chat/sin-conexion/:idSesion',
        '/app/estudiante/chat/demo-sin-conexion',
        '/app/estudiante/cronograma/contenido-vigente',
        '/app/estudiante/sos',
        ...ADMIN_PATHS.map((path) =>
          path
            .replace(/\/cohortes\/co-1(?=\/|$)/, '/cohortes/:idCohorte')
            .replace('/seguimiento/P-7F3A91C2', '/seguimiento/:codigoParticipante')
            .replace('/u-1/informacion', '/:participantId/informacion')
            .replace('/c-1/', '/:contentId/')
            .replace('/s-1/unidades/u-1', '/:scheduleId/unidades/:unitId')
            .replace('/s-1/', '/:idSchedule/')
            .replace('/grupal/f-1', '/grupal/:flowId')
            .replace('/participantes/P-1A2B3C4D/', '/participantes/:codigoParticipante/')
            .replace('/sesiones/00000000-0000-4000-8000-000000000001/', '/sesiones/:idSesion/'),
        ),
        '*',
      ].sort(),
    ));
});
