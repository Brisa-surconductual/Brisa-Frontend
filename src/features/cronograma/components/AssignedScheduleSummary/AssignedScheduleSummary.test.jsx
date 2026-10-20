import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AssignedScheduleSummary } from './AssignedScheduleSummary.jsx';
import { useAssignedSchedule } from '../../hooks/useAssignedSchedule.js';
vi.mock('../../hooks/useAssignedSchedule.js', () => ({
  useAssignedSchedule: vi.fn(),
}));
const render = () => renderToStaticMarkup(<AssignedScheduleSummary />);
beforeEach(() =>
  useAssignedSchedule.mockReturnValue({
    schedule: null,
    loading: false,
    error: '',
    retry: vi.fn(),
  }),
);
describe('Cronograma asignado visible al estudiante', () => {
  it('explica la preparación de un cronograma sin perder la asignación', () => {
    useAssignedSchedule.mockReturnValue({
      schedule: {
        nombre: 'Base',
        estado: 'INACTIVO',
        fecha_inicio_usuario: '2026-10-20T00:00:00Z',
      },
    });
    expect(render()).toContain('Tu asignación se conserva');
  });
  it('muestra carga accesible', () => {
    useAssignedSchedule.mockReturnValue({ loading: true });
    expect(render()).toContain('Consultando tu cronograma...');
    expect(render()).toContain('role="status"');
  });
  it('diferencia asignación pendiente de contenido vacío', () => {
    const html = render();
    expect(html).toContain('pendiente de asignación');
    expect(html).toContain('Actualizar cronograma');
  });
  it('muestra el nombre y fecha individual en Colombia', () => {
    useAssignedSchedule.mockReturnValue({
      schedule: {
        nombre: 'Base para estudiantes',
        fecha_inicio_usuario: '2026-10-20T02:00:00Z',
      },
    });
    const html = render();
    expect(html).toContain('Base para estudiantes');
    expect(html).toContain('19 de octubre de 2026');
  });
  it('muestra error y recuperación sin afirmar que no hay asignación', () => {
    useAssignedSchedule.mockReturnValue({ error: 'Error de consulta' });
    const html = render();
    expect(html).toContain('role="alert"');
    expect(html).toContain('Reintentar consulta');
    expect(html).not.toContain('pendiente de asignación');
  });
});
