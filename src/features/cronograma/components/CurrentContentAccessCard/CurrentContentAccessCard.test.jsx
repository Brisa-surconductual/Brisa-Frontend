import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CurrentContentAccessCard } from './CurrentContentAccessCard.jsx';
import { useCurrentContents } from '../../hooks/useCurrentContents.js';
vi.mock('../../hooks/useCurrentContents.js', () => ({
  useCurrentContents: vi.fn(),
}));
vi.mock('../AssignedScheduleSummary/AssignedScheduleSummary.jsx', () => ({
  AssignedScheduleSummary: () => <span>Cronograma asignado</span>,
}));
const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <CurrentContentAccessCard />
    </MemoryRouter>,
  );
beforeEach(() =>
  useCurrentContents.mockReturnValue({
    currentContent: [],
    loading: false,
    loadError: '',
    retry: vi.fn(),
  }),
);
describe('Contenido visible desde el inicio del estudiante', () => {
  it('muestra contenido vigente junto con el cronograma, sin abrir otra página', () => {
    useCurrentContents.mockReturnValue({
      currentContent: [
        {
          associationId: 'asociacion',
          name: 'Manejo',
          temporalUnitName: 'Diagnóstico',
        },
      ],
      loading: false,
      retry: vi.fn(),
    });
    expect(render()).toContain('Manejo');
    expect(render()).toContain('Diagnóstico');
  });
  it('explica la disponibilidad individual cuando no hay contenido vigente', () => {
    expect(render()).toContain('fecha individual de inicio');
  });
  it('distingue un error de consulta de una ventana sin contenido', () => {
    useCurrentContents.mockReturnValue({
      currentContent: [],
      loadError: 'Error de consulta',
      retry: vi.fn(),
    });
    expect(render()).toContain('role="alert"');
    expect(render()).not.toContain('No hay contenido vigente');
  });
});
