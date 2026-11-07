import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { SchedulePanelPage } from './SchedulePanelPage.jsx';

// La activación real (hook + diálogo) no es objeto de esta prueba.
vi.mock('../../hooks/useScheduleActivation.js', () => ({
  useScheduleActivation: () => ({
    open: false,
    isSubmitting: false,
    error: '',
    requestActivation: () => {},
    confirmActivation: () => {},
    cancelActivation: () => {},
  }),
}));

const BASE = Object.freeze({
  idCronograma: 'qa-1',
  nombreCronograma: 'Cronograma QA',
  esBase: true,
  fechaCreacion: '2026-11-02T00:00:00.000Z',
});

/*
 * Render inicial: el panel parte del cronograma recibido por
 * location.state y aún está consultando las unidades.
 */
function render(schedule) {
  return renderToStaticMarkup(
    <MemoryRouter
      initialEntries={[
        { pathname: '/app/administrativo/cronograma/qa-1/panel', state: schedule ? { schedule } : null },
      ]}
    >
      <Routes>
        <Route
          path="/app/administrativo/cronograma/:idSchedule/panel"
          element={<SchedulePanelPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Panel del cronograma', () => {
  it('sin datos todavía: consulta el cronograma con el layout visible', () => {
    const html = render(null);

    expect(html).toMatch(/role="status"[^>]*>Consultando cronograma/);
    expect(html).toContain('Volver a todos los cronogramas');
    expect(html).not.toContain('<main');
  });

  it('cronograma inactivo: nombre, estado, tipo, creación y acciones', () => {
    const html = render({ ...BASE, estado: 'INACTIVO' });

    expect(html).toContain('Cronograma QA</h1>');
    expect(html).toContain('Inactivo');
    expect(html).toContain('Cronograma base');
    expect(html).toContain('2026-11-02');
    expect(html).toContain('Validar y activar cronograma');
    expect(html).toContain('Crear unidad temporal');
    expect(html).toContain('Sin unidades no se puede activar.');
  });

  it('mientras carga unidades, activar y crear quedan deshabilitados', () => {
    const html = render({ ...BASE, estado: 'INACTIVO' });

    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Validar y activar cronograma/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Crear unidad temporal/);
    expect(html).toMatch(/role="status"[^>]*>Cargando unidades temporales/);
  });

  it('cronograma activo: solo lectura, sin activar y sin crear unidades', () => {
    const html = render({ ...BASE, estado: 'ACTIVO' });

    expect(html).toContain('Activo');
    expect(html).toContain('Cronograma activo · solo lectura');
    expect(html).not.toContain('Validar y activar cronograma');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Crear unidad temporal/);
  });

  it('conserva los filtros de estado y fecha con su conteo', () => {
    const html = render({ ...BASE, estado: 'INACTIVO' });

    expect(html).toContain('id="schedule-status"');
    expect(html).toContain('id="schedule-date"');
    expect(html).toContain('0 de 0');
  });

  it('un solo h1 y sin <main> propio', () => {
    const html = render({ ...BASE, estado: 'INACTIVO' });

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });
});
