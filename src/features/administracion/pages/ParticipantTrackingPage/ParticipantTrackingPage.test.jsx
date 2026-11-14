import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { INITIAL_TRACKING_QUERY } from '../../services/trackingQuery.js';
import { ParticipantTrackingPage } from './ParticipantTrackingPage.jsx';
import { TRACKING_PROBLEM } from './hooks/useParticipantTracking.js';

const hook = vi.hoisted(() => ({ value: null, args: null }));

// Por defecto usa el hook real; cada prueba puede fijar un estado.
vi.mock('./hooks/useParticipantTracking.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParticipantTracking: (args) => {
      hook.args = args;
      return hook.value ?? actual.useParticipantTracking(args);
    },
  };
});

const ENTRIES = Object.freeze([
  Object.freeze({ code: 'X-1', progress: 82, adherence: 91, activeAlertCount: 0 }),
  Object.freeze({ code: 'X-2', progress: 46.4, adherence: 58, activeAlertCount: 1 }),
  Object.freeze({ code: 'X-3', progress: null, adherence: null, activeAlertCount: null }),
  Object.freeze({ code: 'X-4', progress: 21, adherence: 34, activeAlertCount: 3 }),
]);

const BASE = Object.freeze({
  cohort: { id: 'c-1', name: 'Cohorte de prueba' },
  entries: [],
  blockedCount: 0,
  total: 0,
  range: { from: 0, to: 0 },
  pageNumber: 1,
  pageCount: 1,
  canGoBack: false,
  canGoForward: false,
  filters: INITIAL_TRACKING_QUERY.filters,
  sortValue: '',
  hasFilters: false,
  isLoading: false,
  problem: null,
  isDemo: true,
  isIntegrationPending: false,
  setFilter: vi.fn(),
  setSort: vi.fn(),
  clearFilters: vi.fn(),
  goBack: vi.fn(),
  goForward: vi.fn(),
  retry: vi.fn(),
});

function render(changes, entry = '/app/administrativo/cohortes/c-1/seguimiento') {
  hook.value = changes ? { ...BASE, ...changes } : null;
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento" element={<ParticipantTrackingPage />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const withList = (changes = {}) =>
  render({ entries: ENTRIES, total: 6, range: { from: 1, to: 4 }, pageCount: 2, canGoForward: true, ...changes });
const cardOf = (html, code) => {
  const start = html.indexOf(`>${code}</span>`);
  return html.slice(html.lastIndexOf('<article', start), html.indexOf('</article>', start));
};

afterEach(() => {
  hook.value = null;
  hook.args = null;
  vi.unstubAllEnvs();
});

describe('Seguimiento por cohorte (RF-142): presentación', () => {
  it('pide los datos con el identificador de la ruta y enlaza de vuelta a la cohorte', () => {
    const html = render({});

    expect(hook.args).toEqual({ cohortId: 'c-1' });
    expect(html).toContain('href="/app/administrativo/cohortes/c-1"');
    expect(html).toMatch(/<h1[^>]*>Seguimiento de participantes<\/h1>/);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(textOf(html)).toContain('«Cohorte de prueba»');
  });

  it('identifica la consulta como de solo lectura y los datos como demostración', () => {
    const text = textOf(withList());

    expect(text).toContain('Información de solo lectura');
    expect(text).toContain('no pueden modificarse desde aquí');
    expect(text).toContain('Datos de demostración');
    expect(text).toContain('ni se calculan a partir de la elegibilidad');
  });

  it('muestra código, nivel de progreso, adherencia y alertas activas de cada participante', () => {
    const html = withList();
    const text = textOf(cardOf(html, 'X-2'));

    expect(html.match(/<article/g)).toHaveLength(4);
    expect(text).toMatch(/Nivel de progreso 46 %/);
    expect(text).toMatch(/Tasa de adherencia 58 %/);
    expect(text).toMatch(/Alertas activas 1 alerta activa/);
    expect(textOf(cardOf(html, 'X-1'))).toContain('Sin alertas activas');
    expect(textOf(cardOf(html, 'X-4'))).toContain('3 alertas activas');
  });

  it('un indicador ausente se indica como no disponible, sin barra ni estimación', () => {
    const card = cardOf(withList(), 'X-3');

    expect(textOf(card).match(/No disponible/g)).toHaveLength(3);
    expect(card).not.toContain('width:');
  });

  it('las alertas usan texto e ícono, no solo color', () => {
    expect(cardOf(withList(), 'X-4')).toMatch(/<svg[^>]*aria-hidden="true"[\s\S]*3 alertas activas/);
  });

  it('no ofrece escritura ni fichas individuales: sin enlaces por participante ni campos de edición', () => {
    const html = withList();
    const list = html.slice(html.indexOf('<ol'), html.indexOf('</ol>'));

    expect(list).not.toMatch(/<a |<button|<input|<textarea|<form/);
    expect(textOf(html)).not.toMatch(/Editar|Eliminar|Exportar|Ver ficha|Marcar como atendida/);
  });
});

describe('Filtros, orden y paginación', () => {
  it('ofrece filtros por progreso, adherencia y alertas, y orden por indicador', () => {
    const html = withList();

    expect(html).toMatch(/role="search"[^>]*aria-label="Filtrar y ordenar participantes"/);
    for (const label of ['Nivel de progreso', 'Tasa de adherencia', 'Alertas activas', 'Ordenar por']) {
      expect(html).toContain(`>${label}</label>`);
    }
    expect(html).toContain('50 % o más');
    expect(html).toContain('Con alertas activas');
    expect(html).toContain('Progreso: de mayor a menor');
    expect(html).not.toMatch(/Nombre|Correo/);
  });

  it('refleja los filtros activos y ofrece limpiarlos', () => {
    const html = withList({ filters: { progressMin: 50, adherenceMin: null, alerts: 'con-alertas' }, sortValue: 'progreso-desc', hasFilters: true });

    expect(html).toMatch(/<option value="50" selected="">/);
    expect(html).toMatch(/<option value="con-alertas" selected="">/);
    expect(html).toMatch(/<option value="progreso-desc" selected="">/);
    expect(textOf(html)).toContain('Limpiar filtros');
  });

  it('paginación accesible con rango anunciado y botones en su estado', () => {
    const html = withList();

    expect(html).toMatch(/<nav aria-label="Paginación del seguimiento"/);
    expect(html).toMatch(/aria-live="polite"[^>]*>1–4 de 6 participantes · página 1 de 2/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>.*Anterior/);
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Siguiente/);
  });
});

describe('Estados de la pantalla', () => {
  it('cargando: aviso accesible, controles bloqueados y sin registros', () => {
    const html = render({ isLoading: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/role="status"[^>]*>Cargando indicadores de seguimiento/);
    expect(html).toMatch(/<select[^>]*disabled=""/);
    expect(html).not.toContain('<article');
  });

  it('cohorte sin participantes', () => {
    const html = render({});

    expect(html).toMatch(/role="status"[\s\S]*No se encontraron participantes registrados para la cohorte seleccionada\./);
    expect(html).not.toContain('Paginación');
  });

  it('resultado vacío tras filtrar: lo distingue y ofrece limpiar filtros', () => {
    const html = render({ hasFilters: true, filters: { progressMin: 75, adherenceMin: null, alerts: null } });

    expect(textOf(html)).toContain('Ningún participante coincide con los filtros aplicados.');
    expect(textOf(html)).not.toContain('No se encontraron participantes registrados');
  });

  it('cohorte inexistente: alerta y sin controles', () => {
    const html = render({ problem: TRACKING_PROBLEM.NOT_FOUND, cohort: null });

    expect(html).toMatch(/role="alert"[\s\S]*La cohorte solicitada no existe en el sistema\./);
    expect(html).not.toContain('role="search"');
  });

  it('acceso denegado: alerta, sin controles ni registros, y aclara que en la demo es simulado', () => {
    const html = render({ problem: TRACKING_PROBLEM.DENIED, entries: [], total: 0 });

    expect(html).toMatch(/role="alert"[\s\S]*Acceso denegado/);
    expect(textOf(html)).toContain('Resultado simulado por la fuente de demostración');
    expect(html).not.toContain('role="search"');
    expect(html).not.toContain('<article');
  });

  it('respuesta de otra cohorte: alerta sin registros', () => {
    const html = render({ problem: TRACKING_PROBLEM.INCONSISTENT });

    expect(textOf(html)).toContain('La información recibida no corresponde a la cohorte solicitada.');
    expect(html).not.toContain('<article');
  });

  it('registros de otra cohorte ocultos: alerta con su número, y solo se muestran los propios', () => {
    const html = withList({ blockedCount: 1 });

    expect(html).toMatch(/role="alert"[\s\S]*Se ocultó 1 registro que no corresponde a esta cohorte/);
    expect(html.match(/<article/g)).toHaveLength(4);
  });

  it('error de consulta: alerta con reintento', () => {
    const html = render({ problem: TRACKING_PROBLEM.ERROR });

    expect(html).toMatch(/role="alert"[\s\S]*Indicadores no disponibles/);
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('<article');
  });

  it('integración pendiente: sin registros, filtros, aviso de demo ni de solo lectura', () => {
    const html = render({ isIntegrationPending: true, isDemo: false, isLoading: false });

    expect(html).toMatch(/role="status"[\s\S]*Integración pendiente/);
    expect(html).not.toMatch(/role="search"|<article|Datos de demostración/);
  });

  it('con el hook real y sin modo demo, muestra la integración pendiente', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'false');

    expect(render(null)).toContain('Integración pendiente');
  });
});
