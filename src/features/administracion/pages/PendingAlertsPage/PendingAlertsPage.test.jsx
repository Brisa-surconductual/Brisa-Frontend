import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { PENDING_ALERTS_STATUS as S } from '../../types/pendingAlerts.js';

import { PendingAlertsPage } from './PendingAlertsPage.jsx';

const hook = vi.hoisted(() => ({ value: null, args: [] }));

vi.mock('./hooks/usePendingAlerts.js', () => ({
  usePendingAlerts: (args) => {
    hook.args.push(args);
    return hook.value;
  },
}));

const COHORT = 'c0000000-0000-4000-8000-000000000001';
const PATH = `/app/administrativo/cohortes/${COHORT}/alertas/pendientes`;

const alert = (n, type = 'CRAVING_ELEVADO') => ({
  id: `a0000000-0000-4000-8000-00000000000${n}`,
  type,
  generatedAt: '2026-11-12T22:15:00Z',
  participantCode: `P-0000000${n}`,
});

const READY = Object.freeze({
  cohort: { id: COHORT, name: 'Cohorte Piloto A' },
  isDemo: false,
  status: S.READY,
  message: '',
  canRetry: false,
  page: { items: [alert(1), alert(2, 'INACTIVIDAD')], total: 25, offset: 0, limit: 20 },
  pagination: { range: { from: 1, to: 2 }, pageNumber: 1, pageCount: 2, canGoBack: false, canGoForward: true },
  filter: null,
  busy: false,
  notice: null,
  requiresRefresh: false,
  dialog: null,
  changeFilter: vi.fn(),
  goBack: vi.fn(),
  goForward: vi.fn(),
  retry: vi.fn(),
  refresh: vi.fn(),
  openAttend: vi.fn(),
  changeReason: vi.fn(),
  cancelAttend: vi.fn(),
  confirmAttend: vi.fn(),
});

function render(changes = {}, path = PATH) {
  hook.value = { ...READY, ...changes };
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/alertas/pendientes" element={<PendingAlertsPage />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

afterEach(() => {
  hook.value = null;
  hook.args = [];
});

describe('Bandeja de alertas pendientes (RF-146)', () => {
  it('consulta la cohorte de la URL y vuelve a su detalle', () => {
    const html = render();

    expect(hook.args.at(-1)).toEqual({ cohortId: COHORT });
    expect(html).toContain(`href="/app/administrativo/cohortes/${COHORT}"`);
    expect(html).toContain('Volver a la cohorte');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });

  it('muestra cohorte, total del servidor, filtro y alertas con seudónimo, tipo y fecha', () => {
    const html = render();
    const visible = text(html);

    expect(html).toContain('Alertas pendientes</h1>');
    expect(visible).toContain('Cohorte Piloto A');
    expect(visible).toContain('25 alertas pendientes');
    expect(html).toContain('<legend');
    for (const label of ['Todas', 'Craving elevado', 'Inactividad']) expect(visible).toContain(label);
    expect(html).toMatch(/type="radio"[^>]*checked=""/);
    expect(visible).toContain('P-00000001');
    expect(visible).toContain('P-00000002');
    expect(html).toContain('<time dateTime="2026-11-12T22:15:00Z">');
    expect(html.match(/Marcar como atendida/g).length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('aria-label="Paginación de alertas pendientes"');
    expect(visible).toContain('1–2 de 25 alertas · página 1 de 2');
  });

  it('sin referencias técnicas ni datos personales en la interfaz', () => {
    const visible = text(render());

    expect(visible).not.toMatch(/\bRF-?\d|\bM0\d\b|CRAVING_ELEVADO|INACTIVIDAD\b|backend|@/);
  });

  it('204: «Sin alertas pendientes», con o sin filtro', () => {
    expect(text(render({ status: S.EMPTY, page: null, pagination: null }))).toContain('No hay alertas pendientes en la cohorte.');
    expect(text(render({ status: S.EMPTY, page: null, pagination: null, filter: 'INACTIVIDAD' })))
      .toContain('No hay alertas pendientes de este tipo en la cohorte.');
  });

  it('cargando: ocupado y sin lista', () => {
    const html = render({ status: S.LOADING, page: null, pagination: null });

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Consultando alertas pendientes...');
    expect(html).not.toContain('Marcar como atendida');
  });

  it.each([
    [S.COHORT_NOT_FOUND, 'La cohorte solicitada no existe en el sistema.', false],
    [S.SOURCE_UNAVAILABLE, 'El módulo de seguimiento no se encuentra disponible en este momento.', true],
    [S.DENIED, 'No tiene permisos.', false],
    [S.SERVER_ERROR, '', true],
  ])('%s: aviso con el mensaje del backend o el respaldo, nunca una lista vacía', (status, message, canRetry) => {
    const html = render({ status, message, canRetry, page: null, pagination: null });

    expect(html).toContain('role="alert"');
    expect(html).not.toContain('Sin alertas pendientes');
    expect(html).not.toContain('Marcar como atendida');
    if (message) expect(text(html)).toContain(message);
    expect(html.includes('Reintentar')).toBe(canRetry);
  });

  it('401: redirige al inicio de sesión sin pintar la bandeja', () => {
    // <Navigate> actúa en un efecto: en renderizado estático no pinta nada.
    expect(render({ status: S.UNAUTHENTICATED, page: null })).toBe('');
  });

  it('modo de demostración: aviso propio, sin consulta ni acciones', () => {
    const html = render({ isDemo: true, status: S.DEMO_UNAVAILABLE, page: null, pagination: null });

    expect(text(html)).toContain('No disponible en la demostración');
    expect(html).not.toContain('Marcar como atendida');
    expect(html).not.toContain('Tipo de alerta');
  });

  it('tras un resultado incierto: aviso de error, acción para actualizar y acciones bloqueadas', () => {
    const html = render({
      requiresRefresh: true,
      notice: { tone: 'danger', text: 'No fue posible registrar la acción. La alerta conserva su estado.' },
    });

    expect(text(html)).toContain('No fue posible registrar la acción.');
    expect(html).toContain('Actualizar alertas');
    expect(html.match(/<button[^>]*disabled=""[^>]*>[^<]*<svg[\s\S]*?Marcar como atendida/g)).toHaveLength(2);
  });

  it('éxito: aviso de confirmación', () => {
    const html = render({ notice: { tone: 'success', text: 'La alerta de P-00000001 quedó registrada como atendida.' } });

    expect(html).toContain('role="status"');
    expect(text(html)).toContain('quedó registrada como atendida');
  });
});

describe('Diálogo de atención (RF-147)', () => {
  const dialog = (changes = {}) => ({
    alert: alert(1),
    reason: '',
    reasonError: '',
    error: '',
    submitting: false,
    ...changes,
  });

  it('muestra tipo, participante, advertencia, motivo con contador y las dos acciones', () => {
    const html = render({ dialog: dialog({ reason: '  Llamada  ' }) });
    const visible = text(html);

    expect(visible).toContain('Marcar alerta como atendida');
    expect(visible).toMatch(/Tipo Craving elevado/);
    expect(visible).toMatch(/Participante P-00000001/);
    expect(visible).toContain('Esta acción es definitiva');
    expect(visible).toContain('no podrá revertirse');
    expect(html).toContain('Motivo de atención');
    expect(html).toMatch(/<textarea[^>]*required=""/);
    expect(visible).toContain('7 / 500 caracteres · mínimo 10');
    expect(visible).toContain('Cancelar');
    expect(visible).toContain('Confirmar atención');
  });

  it('procesando: campo y cancelar bloqueados y estado visible', () => {
    const html = render({ dialog: dialog({ reason: 'Motivo suficiente.', submitting: true }), busy: true });

    expect(html).toMatch(/<textarea[^>]*disabled=""/);
    expect(html).toContain('Registrando...');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Cancelar<\/button>/);
  });

  it('error del motivo junto al campo y error general en el diálogo', () => {
    const invalid = render({ dialog: dialog({ reasonError: 'El motivo debe tener al menos 10 caracteres.' }) });
    const unavailable = render({ dialog: dialog({ error: 'El módulo de seguimiento no está disponible.' }) });

    expect(invalid).toMatch(/aria-invalid="true"/);
    expect(text(invalid)).toContain('El motivo debe tener al menos 10 caracteres.');
    expect(text(unavailable)).toContain('El módulo de seguimiento no está disponible.');
  });

  it('cerrado: no pinta el formulario', () => {
    expect(render()).not.toContain('Confirmar atención');
  });
});
