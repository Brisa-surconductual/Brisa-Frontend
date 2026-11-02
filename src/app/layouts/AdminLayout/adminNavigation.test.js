import { describe, expect, it } from 'vitest';

import {
  ADMIN_NAV_ITEMS,
  ADMIN_SECTION,
  getActiveAdminSection,
  getAdminSectionLabel,
} from './adminNavigation.js';

describe('Sección administrativa activa', () => {
  it.each([
    ['/app/administrativo', '', ADMIN_SECTION.DASHBOARD],
    ['/app/administrativo/', '', ADMIN_SECTION.DASHBOARD],
    ['/app/administrativo', '?tab=POBLACION', ADMIN_SECTION.POBLACION],
    ['/app/administrativo', '?tab=AJUSTES', ADMIN_SECTION.AJUSTES],
    // Igual que el panel: un ?tab= desconocido es el Dashboard.
    ['/app/administrativo', '?tab=CHAT', ADMIN_SECTION.DASHBOARD],
    ['/app/administrativo', '?tab=OTRA', ADMIN_SECTION.DASHBOARD],
  ])('%s%s → %s', (pathname, search, expected) =>
    expect(getActiveAdminSection(pathname, search)).toBe(expected));

  it.each([
    '/app/administrativo/cronograma',
    '/app/administrativo/cronograma/crear',
    '/app/administrativo/cronograma/assignar',
    '/app/administrativo/cronograma/pausas',
    '/app/administrativo/cronograma/pausas/nueva',
    '/app/administrativo/cronograma/progreso',
    '/app/administrativo/cronograma/progreso/u-1/informacion-temporal',
    '/app/administrativo/cronograma/contenidos',
    '/app/administrativo/cronograma/contenidos/c-1/editar',
    '/app/administrativo/cronograma/contenidos/c-1/recursos',
    '/app/administrativo/cronograma/s-1/panel',
    '/app/administrativo/cronograma/s-1/crear-unidad',
    '/app/administrativo/cronograma/s-1/unidades/u-1',
    '/app/administrativo/cronograma/s-1/unidades/u-1/contenido',
  ])('%s pertenece a Cronogramas', (pathname) =>
    expect(getActiveAdminSection(pathname)).toBe(ADMIN_SECTION.CRONOGRAMA));

  it.each([
    '/app/administrativo/chat/modalidad',
    '/app/administrativo/chat/arboles',
  ])('%s pertenece a Chat', (pathname) =>
    expect(getActiveAdminSection(pathname)).toBe(ADMIN_SECTION.CHAT));

  it('fuera del área administrativa no marca ninguna sección', () =>
    expect(getActiveAdminSection('/app/estudiante')).toBeNull());
});

describe('Elementos de navegación', () => {
  it('ofrece las cinco secciones reales en orden', () =>
    expect(ADMIN_NAV_ITEMS.map(({ label }) => label)).toEqual([
      'Dashboard',
      'Población',
      'Cronogramas',
      'Chat',
      'Ajustes',
    ]));

  it('cada enlace marca activa su propia sección', () => {
    for (const { id, to } of ADMIN_NAV_ITEMS) {
      expect(getActiveAdminSection(to.pathname, to.search ?? '')).toBe(id);
    }
  });

  it('expone la etiqueta de cada sección', () => {
    expect(getAdminSectionLabel(ADMIN_SECTION.CRONOGRAMA)).toBe('Cronogramas');
    expect(getAdminSectionLabel(null)).toBe('');
  });
});
