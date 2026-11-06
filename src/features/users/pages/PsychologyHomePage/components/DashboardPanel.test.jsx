import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { DashboardPanel } from './DashboardPanel.jsx';
import { useProgramStats } from '../hooks/useProgramStats.js';
import { DASHBOARD_SHORTCUTS, PROGRAM_STATS } from '../data/psychologyStats.js';

vi.mock('../hooks/useProgramStats.js', () => ({ useProgramStats: vi.fn() }));

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <DashboardPanel />
    </MemoryRouter>,
  );

const stats = {
  estudiantesActivos: 1234,
  conRegistroCompleto: 1200,
  conRegistroPendiente: 34,
  diasCronogramaBase: 10,
};

/* Cifras de los indicadores, en el orden de las tarjetas. */
function figures(html) {
  return [...html.matchAll(/<p class="[^"]*tabular-nums">([^<]*)<\/p>/g)].map(
    ([, value]) => value,
  );
}

beforeEach(() =>
  useProgramStats.mockReturnValue({
    stats,
    loading: false,
    error: '',
    retry: vi.fn(),
  }),
);

describe('Dashboard con cifras reales', () => {
  it('presenta los cuatro indicadores con las cifras recibidas y formato colombiano', () => {
    const html = render();

    expect(figures(html)).toEqual(['1.234', '1.200', '34', '10']);
    for (const { label } of PROGRAM_STATS) expect(html).toContain(label);
    expect(html).toContain('Actualizar estadísticas');
    expect(html).not.toContain('Cifras de ejemplo');
  });

  it('cada indicador se lee de su campo del contrato', () =>
    expect(PROGRAM_STATS.map(({ key }) => key)).toEqual([
      'estudiantesActivos',
      'conRegistroCompleto',
      'conRegistroPendiente',
      'diasCronogramaBase',
    ]));

  it('muestra los ceros reales como ceros y null como ausencia de dato', () => {
    useProgramStats.mockReturnValue({
      stats: {
        estudiantesActivos: 0,
        conRegistroCompleto: 0,
        conRegistroPendiente: 0,
        diasCronogramaBase: null,
      },
    });

    const html = render();

    expect(figures(html)).toEqual(['0', '0', '0', '—']);
    expect(html.match(/Sin dato/g)).toHaveLength(1);
    expect(html).toContain('La duración estará disponible');
  });

  it('no inventa porcentajes, tendencias ni gráficas', () => {
    const html = render();

    expect(html).not.toMatch(/%|tendencia|crecimiento|<svg[^>]*role="img"|<canvas/i);
  });

  it('no muestra datos personales', () =>
    expect(render()).not.toMatch(/@|idUsuario|correo/i));
});

describe('Estados de carga y error', () => {
  it('carga: esqueletos accesibles, sin cifras ni ceros ficticios', () => {
    useProgramStats.mockReturnValue({ loading: true });

    const html = render();

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/role="status"[^>]*>Consultando estadísticas/);
    expect(figures(html)).toEqual([]);
    expect(html).not.toMatch(/>0</);
    expect(html.match(/animate-pulse/g)).toHaveLength(4);
    expect(html).toMatch(/<button[^>]*disabled=""/);
  });

  it('error: alerta visible con reintento y sin datos falsos', () => {
    useProgramStats.mockReturnValue({
      error: 'No pudimos cargar las estadísticas. Intenta nuevamente.',
    });

    const html = render();

    expect(html).toContain('role="alert"');
    expect(html).toContain('No pudimos cargar las estadísticas. Intenta nuevamente.');
    expect(html).toContain('Reintentar consulta');
    expect(figures(html)).toEqual(['—', '—', '—', '—']);
    expect(html.match(/No disponible/g)).toHaveLength(4);
    expect(html).not.toContain('Sin dato');
  });

  it('el botón de reintentar usa el retry del hook', () => {
    const retry = vi.fn();

    useProgramStats.mockReturnValue({ error: 'Error', retry });

    const element = DashboardPanel();
    const findRetry = (node) => {
      if (!node || typeof node !== 'object') return null;
      if (node.props?.onClick === retry) return node;
      const children = [].concat(node.props?.children ?? []);
      for (const child of children) {
        const found = findRetry(child);
        if (found) return found;
      }
      return null;
    };

    findRetry(element).props.onClick();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe('Accesos de gestión', () => {
  it('enlazan solo a las rutas definidas', () => {
    const html = render();

    for (const { to, title } of DASHBOARD_SHORTCUTS) {
      expect(html).toContain(`href="${to}"`);
      expect(html).toContain(title);
    }
    expect(html).not.toContain('tab=POBLACION');
  });

  it('identifican el chat como pendiente de integración', () =>
    expect(render()).toContain('Integración pendiente'));
});
