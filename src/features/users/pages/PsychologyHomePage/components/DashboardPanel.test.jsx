import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardPanel } from './DashboardPanel.jsx';
import { useProgramStats } from '../hooks/useProgramStats.js';
vi.mock('../hooks/useProgramStats.js', () => ({ useProgramStats: vi.fn() }));
const render = () => renderToStaticMarkup(<DashboardPanel />);
const stats = {
  estudiantesActivos: 1234,
  conRegistroCompleto: 1200,
  conRegistroPendiente: 34,
  diasCronogramaBase: 10,
};
beforeEach(() =>
  useProgramStats.mockReturnValue({
    stats,
    loading: false,
    error: '',
    retry: vi.fn(),
  }),
);
describe('Dashboard con cifras reales', () => {
  it('muestra las cifras recibidas con formato colombiano', () => {
    const html = render();
    expect(html).toContain('1.234');
    expect(html).toContain('1.200');
    expect(html).toContain('Días del cronograma base');
    expect(html).toContain('Actualizar estadísticas');
    expect(html).not.toContain('Cifras de ejemplo');
  });
  it('muestra carga sin cifras de ejemplo ni ceros ficticios', () => {
    useProgramStats.mockReturnValue({ loading: true });
    const html = render();
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html.match(/—/g)).toHaveLength(4);
    expect(html).toMatch(/<button[^>]*disabled=""/);
  });
  it('muestra el error y permite reintentar sin presentar datos falsos', () => {
    useProgramStats.mockReturnValue({
      error: 'No pudimos cargar las estadísticas.',
    });
    const html = render();
    expect(html).toContain('role="alert"');
    expect(html).toContain('Reintentar consulta');
    expect(html.match(/—/g)).toHaveLength(4);
  });
  it('muestra los ceros reales como ceros', () => {
    useProgramStats.mockReturnValue({
      stats: {
        estudiantesActivos: 0,
        conRegistroCompleto: 0,
        conRegistroPendiente: 0,
        diasCronogramaBase: null,
      },
    });
    const html = render();
    expect(html.match(/>0<\/p>/g)).toHaveLength(3);
    expect(html).toContain('La duración estará disponible');
  });
});
