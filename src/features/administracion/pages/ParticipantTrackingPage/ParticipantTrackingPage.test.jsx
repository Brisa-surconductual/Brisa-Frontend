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

const entry = (code, changes = {}) =>
  Object.freeze({
    code,
    detailCode: code,
    progressLevel: 'EN_AVANCE',
    adherence: 0.41,
    activeAlertCount: 0,
    attendedAlertCount: 0,
    activeAlertTypes: [],
    ...changes,
  });

const ENTRIES = Object.freeze([
  entry('P-00000001', { progressLevel: 'COMPLETADO', adherence: 0.91 }),
  entry('P-7F3A91C2', { activeAlertCount: 2, activeAlertTypes: ['INACTIVIDAD', 'CRAVING_ELEVADO'] }),
  entry('P-00000003', { progressLevel: null, adherence: null }),
  entry('P-00000004', { progressLevel: 'INICIAL', adherence: 0, activeAlertCount: 1, attendedAlertCount: 2, activeAlertTypes: ['INACTIVIDAD'] }),
]);

const BASE = Object.freeze({
  cohort: { id: 'c-1', name: 'Cohorte de prueba' },
  entries: [],
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
  canRetry: false,
  isDemo: false,
  setFilter: vi.fn(),
  setSort: vi.fn(),
  clearFilters: vi.fn(),
  goBack: vi.fn(),
  goForward: vi.fn(),
  retry: vi.fn(),
});

function render(changes, entryPath = '/app/administrativo/cohortes/c-1/seguimiento') {
  hook.value = changes ? { ...BASE, ...changes } : null;
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[entryPath]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento" element={<ParticipantTrackingPage />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const withList = (changes = {}) =>
  render({ entries: ENTRIES, total: 26, range: { from: 1, to: 4 }, pageCount: 2, canGoForward: true, ...changes });
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

  it('identifica la consulta como de solo lectura; el aviso de demostración solo en la demostración', () => {
    const text = textOf(withList());

    expect(text).toContain('Información de solo lectura');
    expect(text).toContain('no pueden modificarse desde aquí');
    expect(text).not.toContain('Datos de demostración');
    expect(textOf(withList({ isDemo: true }))).toContain('Datos de demostración');
  });

  it('200 con participantes: código, nivel como categoría, adherencia en % y alertas activas y atendidas', () => {
    const html = withList();
    const text = textOf(cardOf(html, 'P-7F3A91C2'));

    expect(html.match(/<article/g)).toHaveLength(4);
    expect(text).toMatch(/Nivel de progreso En avance/);
    expect(text).toMatch(/Tasa de adherencia 41 %/);
    expect(text).toMatch(/Alertas activas 2 alertas activas Inactividad · Craving elevado/);
    expect(text).toMatch(/Alertas atendidas 0/);
    expect(textOf(cardOf(html, 'P-00000001'))).toMatch(/Completado .*91 %.*Sin alertas activas/);
    expect(textOf(cardOf(html, 'P-00000004'))).toMatch(/Inicial .*0 %.*1 alerta activa Inactividad.*Alertas atendidas 2/);
  });

  it('el nivel no se presenta como porcentaje', () => {
    expect(textOf(cardOf(withList(), 'P-7F3A91C2'))).not.toMatch(/En avance \d|Nivel de progreso \d/);
  });

  it('sin indicadores: no disponibles, sin barra; una adherencia 0 sí se muestra como 0 %', () => {
    const html = withList();
    const missing = cardOf(html, 'P-00000003');

    expect(textOf(missing)).toMatch(/Nivel de progreso No disponible/);
    expect(textOf(missing)).toMatch(/Tasa de adherencia No disponible/);
    expect(missing).not.toContain('width:');
    expect(cardOf(html, 'P-00000004')).toContain('width:0%');
  });

  it('las alertas usan texto e ícono, no solo color', () => {
    expect(cardOf(withList(), 'P-7F3A91C2')).toMatch(/<svg[^>]*aria-hidden="true"[\s\S]*2 alertas activas/);
  });

  it('cada tarjeta enlaza a su ficha con el código auténtico, y solo a ella', () => {
    const html = withList();
    const list = html.slice(html.indexOf('<ol'), html.indexOf('</ol>'));

    expect(list.match(/<a /g)).toHaveLength(4);
    expect(list).toMatch(/href="\/app\/administrativo\/cohortes\/c-1\/seguimiento\/P-7F3A91C2"[^>]*>Ver ficha<span class="sr-only"> de P-7F3A91C2<\/span>/);
    expect(list).not.toMatch(/seg-|<button|<input|<textarea|<form/);
  });

  it('sin código válido para la ficha no hay enlace, y se explica', () => {
    const html = withList({ entries: [entry('PART-0004', { detailCode: null })], total: 1 });

    expect(html).not.toContain('Ver ficha');
    expect(textOf(cardOf(html, 'PART-0004'))).toContain('el código no tiene el formato esperado');
  });

  it('no muestra datos personales ni internos', () => {
    expect(textOf(withList())).not.toMatch(/@|uuid|demo-participante|Correo|Nombre/i);
  });
});

describe('Filtros, orden y paginación', () => {
  it('ofrece los filtros reales: nivel, adherencia mínima y máxima, alertas y orden por cualquier indicador', () => {
    const html = withList();

    expect(html).toMatch(/role="search"[^>]*aria-label="Filtrar y ordenar participantes"/);
    for (const label of ['Nivel de progreso', 'Adherencia mínima', 'Adherencia máxima', 'Alertas activas', 'Ordenar por']) {
      expect(html).toContain(`>${label}</label>`);
    }
    for (const option of ['Inicial', 'En avance', 'Avanzado', 'Completado', '50 % o más', '75 % o menos', 'Con alertas activas', 'Sin alertas activas']) {
      expect(html).toContain(`>${option}</option>`);
    }
    for (const value of ['codigo_participante:DESC', 'nivel_progreso:DESC', 'tasa_adherencia:ASC', 'alertas_activas:DESC', 'alertas_atendidas:ASC']) {
      expect(html).toContain(`value="${value}"`);
    }
  });

  it('refleja los filtros combinados activos y ofrece limpiarlos', () => {
    const html = withList({
      filters: { level: 'AVANZADO', adherenceMin: 25, adherenceMax: 75, alerts: 'true' },
      sortValue: 'tasa_adherencia:DESC',
      hasFilters: true,
    });

    expect(html).toMatch(/<option value="AVANZADO" selected="">/);
    expect(html).toMatch(/<option value="25" selected="">/);
    expect(html).toMatch(/<option value="75" selected="">/);
    expect(html).toMatch(/<option value="true" selected="">/);
    expect(html).toMatch(/<option value="tasa_adherencia:DESC" selected="">/);
    expect(textOf(html)).toContain('Limpiar filtros');
  });

  it('paginación accesible con rango anunciado y botones en su estado', () => {
    const html = withList();

    expect(html).toMatch(/<nav aria-label="Paginación del seguimiento"/);
    expect(html).toMatch(/aria-live="polite"[^>]*>1–4 de 26 participantes · página 1 de 2/);
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

  it('listado vacío: cohorte sin participantes', () => {
    const html = render({});

    expect(html).toMatch(/role="status"[\s\S]*No se encontraron participantes registrados para la cohorte seleccionada\./);
    expect(html).not.toContain('Paginación');
  });

  it('resultado vacío tras filtrar: lo distingue y ofrece limpiar filtros', () => {
    const html = render({ hasFilters: true, filters: { ...INITIAL_TRACKING_QUERY.filters, level: 'COMPLETADO' } });

    expect(textOf(html)).toContain('Ningún participante coincide con los filtros aplicados.');
    expect(textOf(html)).not.toContain('No se encontraron participantes registrados');
  });

  it.each([
    [TRACKING_PROBLEM.INVALID_QUERY, 'Los filtros aplicados no son válidos.', true, 'Limpiar filtros'],
    [TRACKING_PROBLEM.DENIED, 'No cuenta con autorización para consultar los indicadores', false, null],
    [TRACKING_PROBLEM.NOT_FOUND, 'La cohorte solicitada no existe en el sistema.', false, null],
    [TRACKING_PROBLEM.UNAVAILABLE, 'El módulo de seguimiento no se encuentra disponible en este momento.', true, 'Reintentar'],
    [TRACKING_PROBLEM.INVALID_RESPONSE, 'no tiene el formato esperado. Por seguridad no se muestra ningún registro.', true, 'Reintentar'],
    [TRACKING_PROBLEM.ERROR, 'No pudimos cargar los indicadores de seguimiento.', true, 'Reintentar'],
  ])('%s: alerta sin registros', (problem, message, controls, action) => {
    const canRetry = action === 'Reintentar';
    const html = render({ problem, canRetry });

    expect(html).toMatch(/role="alert"/);
    expect(textOf(html)).toContain(message);
    expect(html).not.toContain('<article');
    expect(html.includes('role="search"')).toBe(controls);
    if (action) expect(textOf(html)).toContain(action);
    if (!canRetry) expect(html).not.toContain('Reintentar');
  });

  it('acceso denegado en la demostración: aclara que es simulado', () => {
    expect(textOf(render({ problem: TRACKING_PROBLEM.DENIED, isDemo: true }))).toContain('Resultado simulado por la fuente de demostración');
    expect(textOf(render({ problem: TRACKING_PROBLEM.DENIED }))).not.toContain('simulado');
  });

  it('sesión vencida (401): lleva al inicio de sesión sin pintar el listado', () => {
    expect(render({ problem: TRACKING_PROBLEM.SESSION_REQUIRED })).toBe('');
  });

  it('con el hook real en la API: cargando, sin datos de demostración', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'false');
    const html = render(null);

    expect(html).toContain('Cargando indicadores de seguimiento');
    expect(html).not.toMatch(/Datos de demostración|<article/);
  });
});
