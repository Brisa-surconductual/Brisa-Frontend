import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

import { AppRouter } from '@/app/router/AppRouter.jsx';
import { RequireAuth } from '@/app/router/RequireAuth.jsx';
import { StudentLayout } from '@/app/layouts/StudentLayout/index.js';
import { USER_ROLE } from '@/features/users/types/authTypes.js';

import { AssignedScheduleSummary } from '../../components/AssignedScheduleSummary/AssignedScheduleSummary.jsx';
import { CurrentContentAccessCard } from '../../components/CurrentContentAccessCard/CurrentContentAccessCard.jsx';
import { CurrentContentCard } from '../../components/CurrentContentCard/CurrentContentCard.jsx';
import { useAssignedSchedule } from '../../hooks/useAssignedSchedule.js';
import { useCurrentContents } from '../../hooks/useCurrentContents.js';
import { CurrentContentPage } from './CurrentContentPage.jsx';

vi.mock('../../hooks/useCurrentContents.js', () => ({ useCurrentContents: vi.fn() }));
vi.mock('../../hooks/useAssignedSchedule.js', () => ({ useAssignedSchedule: vi.fn() }));

const CONTENT = Object.freeze([
  {
    id: 'c-2', associationId: 'a-2', name: 'Segundo QA', type: 'ACTIVIDAD',
    temporalUnitName: 'Semana 1', temporalUnitOrder: 1, order: 2,
    availabilityText: '1/11/2026, 8:00:00 a. m. → 8/11/2026, 8:00:00 a. m.',
  },
  {
    id: 'c-1', associationId: 'a-1', name: 'Primero QA', type: 'INFORMATIVO',
    temporalUnitName: 'Semana 1', temporalUnitOrder: 1, order: 1,
  },
]);

const contents = (extra) =>
  useCurrentContents.mockReturnValue({ currentContent: [], loading: false, loadError: '', retry: vi.fn(), ...extra });

const withRouter = (node) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

beforeEach(() => {
  contents();
  useAssignedSchedule.mockReturnValue({
    schedule: { nombre: 'Cronograma QA', estado: 'ACTIVO', fecha_inicio_usuario: '2026-11-02T05:00:00Z' },
    loading: false, error: '', retry: vi.fn(),
  });
});

describe('Tarjeta de contenido actual en el inicio', () => {
  it('CP-07 conserva datos reales: cronograma, nombre y unidad', () => {
    contents({ currentContent: CONTENT });
    const html = withRouter(<CurrentContentAccessCard />);

    expect(html).toContain('Cronograma asignado: Cronograma QA');
    expect(html).toContain('Segundo QA');
    expect(html).toContain('Semana 1');
    expect(html).not.toMatch(/%|completad/i);
  });

  it('CP-08 la carga anuncia el estado sin mostrar contenido', () => {
    contents({ loading: true, currentContent: CONTENT });
    const html = withRouter(<CurrentContentAccessCard />);

    expect(html).toMatch(/role="status"[^>]*>Consultando contenido vigente/);
    expect(html).not.toContain('Segundo QA');
  });

  it('CP-09 el error conserva su mensaje y la acción de reintentar', () => {
    const retry = vi.fn();
    contents({ loadError: 'No pudimos consultar tu contenido vigente. Intenta nuevamente.', retry });
    const html = withRouter(<CurrentContentAccessCard />);

    expect(html).toMatch(/role="alert"[\s\S]*No pudimos consultar tu contenido vigente/);
    expect(html).toMatch(/<button[^>]*>[\s\S]*Actualizar contenido<\/button>/);
  });

  it('CP-10 el vacío es distinto del error', () => {
    const empty = withRouter(<CurrentContentAccessCard />);

    expect(empty).toContain('No hay contenido vigente para tu avance actual');
    expect(empty).not.toContain('role="alert"');
  });

  it('CP-11 el enlace conserva su destino y es un enlace real', () => {
    expect(withRouter(<CurrentContentAccessCard />)).toMatch(
      /<a [^>]*href="\/app\/estudiante\/cronograma\/contenido-vigente"[^>]*>Ver contenido vigente/,
    );
  });
});

describe('Contenido vigente', () => {
  it('CP-13 renderiza los contenidos de la consulta en su orden real', () => {
    contents({ currentContent: CONTENT });
    const html = withRouter(<CurrentContentPage />);

    expect(html.indexOf('Segundo QA')).toBeLessThan(html.indexOf('Primero QA'));
    expect(html).toContain('2 contenidos');
    expect(useCurrentContents).toHaveBeenCalled();
  });

  it('CP-14 la tarjeta conserva nombre, tipo, unidad, semana, orden y disponibilidad', () => {
    const html = renderToStaticMarkup(<CurrentContentCard content={CONTENT[0]} />);

    expect(html).toContain('Segundo QA');
    expect(html).toContain('Actividad');
    expect(html).toContain('Semana 1 · Semana 1');
    expect(html).toMatch(/Orden<\/dt><dd[^>]*>2</);
    expect(html).toContain(CONTENT[0].availabilityText);
    expect(html).toContain('Vigente');
  });

  it('CP-15 la selección solo existe con onSelect y entrega el contenido', () => {
    const plain = renderToStaticMarkup(<CurrentContentCard content={CONTENT[1]} />);
    expect(plain).not.toContain('<button');

    const onSelect = vi.fn();
    const tree = CurrentContentCard({ content: CONTENT[1], onSelect, headingLevel: 3 });
    const html = renderToStaticMarkup(tree);
    expect(html).toMatch(/<h3[^>]*><button type="button"/);

    const heading = tree.props.children[0].props.children[1].props.children[0];
    heading.props.children.props.onClick();
    expect(onSelect).toHaveBeenCalledWith(CONTENT[1]);
  });

  it('CP-16 el resumen conserva asignado, inactivo, pendiente, carga y error', () => {
    const summary = () => renderToStaticMarkup(<AssignedScheduleSummary />);

    expect(summary()).toContain('Activo');
    useAssignedSchedule.mockReturnValue({ schedule: { nombre: 'QA', estado: 'INACTIVO', fecha_inicio_usuario: '2026-11-02T05:00:00Z' } });
    expect(summary()).toMatch(/role="status"[\s\S]*Tu asignación se conserva/);
    expect(summary()).toContain('2 de noviembre de 2026');
    useAssignedSchedule.mockReturnValue({ schedule: null, retry: vi.fn() });
    expect(summary()).toContain('pendiente de asignación');
    useAssignedSchedule.mockReturnValue({ loading: true });
    expect(summary()).toMatch(/role="status"[^>]*>Consultando tu cronograma/);
    useAssignedSchedule.mockReturnValue({ error: 'No pudimos consultar tu cronograma. Intenta nuevamente.', retry: vi.fn() });
    expect(summary()).toMatch(/role="alert"[\s\S]*Reintentar consulta/);
  });

  it('CP-19 el uso administrativo conserva h2 por defecto', () => {
    expect(renderToStaticMarkup(<CurrentContentCard content={CONTENT[1]} />)).toMatch(/^<article[\s\S]*<h2[^>]*>Primero QA<\/h2>/);
    expect(renderToStaticMarkup(<CurrentContentCard content={CONTENT[1]} headingLevel={3} />)).toContain('Primero QA</h3>');
  });

  it('CP-20 un solo h1, sin <main>, contenidos bajo un h2', () => {
    contents({ currentContent: CONTENT });
    const html = withRouter(<CurrentContentPage />);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(html).toContain('Disponible ahora</h2>');
    expect(html.match(/<h3/g)).toHaveLength(2);
  });
});

describe('Protección por rol (CP-17)', () => {
  const routes = createRoutesFromChildren(AppRouter().props.children.props.children);

  it.each(['/app/estudiante', '/app/estudiante/cronograma/contenido-vigente'])(
    '%s sigue protegida para ESTUDIANTE dentro del StudentLayout',
    (path) => {
      const matches = matchRoutes(routes, path);
      const roles = matches
        .map(({ route }) => route.element)
        .filter((element) => element?.type === RequireAuth)
        .map((element) => element.props.allowedRoles ?? null);

      expect(roles).toContainEqual([USER_ROLE.ESTUDIANTE]);
      expect(matches.some(({ route }) => route.element?.type === StudentLayout)).toBe(true);
    },
  );
});
