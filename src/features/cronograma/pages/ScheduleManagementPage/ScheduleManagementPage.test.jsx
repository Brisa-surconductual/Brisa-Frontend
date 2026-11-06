import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { ScheduleManagementPage } from './ScheduleManagementPage.jsx';
import { getScheduleListErrorMessage } from './hooks/useScheduleList.js';

let listState;

vi.mock('./hooks/useScheduleList.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useScheduleList: () => listState,
}));

const SCHEDULES = [
  { idCronograma: 'qa-1', nombreCronograma: 'Cronograma QA uno', estado: 'INACTIVO', esBase: true, fechaCreacion: '2026-11-02T00:00:00.000Z' },
  { idCronograma: 'qa/2', nombreCronograma: 'Cronograma QA dos', estado: 'ACTIVO', esBase: false, fechaCreacion: '2026-10-01T00:00:00.000Z' },
];

function render(state = {}) {
  listState = { schedules: [], isLoading: false, loadError: '', retry: vi.fn(), ...state };

  return renderToStaticMarkup(
    <MemoryRouter>
      <ScheduleManagementPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  listState = undefined;
});

describe('Listado de cronogramas', () => {
  it('muestra los cronogramas que entrega la API', () => {
    const html = render({ schedules: SCHEDULES });

    expect(html).toContain('Cronograma QA uno');
    expect(html).toContain('Cronograma QA dos');
    expect(html.match(/<article/g)).toHaveLength(2);
    expect(html).toContain('2 cronogramas');
  });

  it('cada tarjeta enlaza al panel con el id codificado', () => {
    const html = render({ schedules: SCHEDULES });

    expect(html).toContain('href="/app/administrativo/cronograma/qa-1/panel"');
    expect(html).toContain('href="/app/administrativo/cronograma/qa%2F2/panel"');
  });

  it('muestra el estado real de cada cronograma', () => {
    const html = render({ schedules: SCHEDULES });

    expect(html).toContain('Inactivo');
    expect(html).toContain('Activo');
  });

  it('conserva las cinco acciones administrativas', () => {
    const html = render({ schedules: SCHEDULES });

    expect(html).toMatch(/<button[^>]*>[\s\S]*?Crear cronograma<\/button>/);
    for (const [label, href] of [
      ['Asignar cronograma a usuario', '/app/administrativo/cronograma/assignar'],
      ['Progreso por usuario', '/app/administrativo/cronograma/progreso'],
      ['Pausas administrativas', '/app/administrativo/cronograma/pausas'],
      ['Gestionar contenidos', '/app/administrativo/cronograma/contenidos'],
    ]) {
      expect(html).toContain(label);
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('carga: esqueletos sin tarjetas ni lista vacía', () => {
    const html = render({ isLoading: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/role="status"[^>]*>Cargando cronogramas/);
    expect(html).not.toContain('<article');
    expect(html).not.toContain('Aún no hay cronogramas');
  });

  it('error: alerta con reintento, distinta de la lista vacía', () => {
    const html = render({ loadError: 'No pudimos cargar los cronogramas. Intenta nuevamente.' });

    expect(html).toContain('role="alert"');
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('Aún no hay cronogramas');
  });

  it('vacío: aviso propio cuando la API no devuelve cronogramas', () => {
    const html = render();

    expect(html).toContain('Aún no hay cronogramas');
    expect(html).not.toContain('role="alert"');
  });

  it('no monta encabezado de app ni <main> propios', () => {
    const html = render({ schedules: SCHEDULES });

    expect(html).not.toContain('<main');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });
});

describe('Mensaje de error del listado', () => {
  it('distingue la sesión vencida', () =>
    expect(getScheduleListErrorMessage({ response: { status: 401 } })).toContain('sesión'));

  it('usa un mensaje genérico sin detalles técnicos', () =>
    expect(getScheduleListErrorMessage(new Error('Network Error'))).toBe(
      'No pudimos cargar los cronogramas. Intenta nuevamente.',
    ));
});
