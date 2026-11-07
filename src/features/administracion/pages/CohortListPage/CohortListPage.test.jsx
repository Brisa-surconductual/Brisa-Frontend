import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { DEMO_COHORTS } from '../../data/cohortDemoData.js';
import { countCohortsByStatus } from '../../services/cohortSummary.js';
import { CohortListPage } from './CohortListPage.jsx';

const state = vi.hoisted(() => ({ value: null }));

// Por defecto usa el hook real; cada prueba puede fijar un estado.
vi.mock('./hooks/useCohortList.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useCohortList: () => state.value ?? actual.useCohortList() };
});

const BASE = Object.freeze({
  cohorts: [],
  statusCounts: countCohortsByStatus([]),
  isLoading: false,
  loadError: '',
  isDemo: false,
  isIntegrationPending: false,
  retry: vi.fn(),
});

function render(changes) {
  state.value = changes ? { ...BASE, ...changes } : null;
  return renderToStaticMarkup(<CohortListPage />).replaceAll('<!-- -->', '');
}

const withDemoList = () =>
  render({ cohorts: DEMO_COHORTS, statusCounts: countCohortsByStatus(DEMO_COHORTS), isDemo: true });

afterEach(() => {
  state.value = null;
  vi.unstubAllEnvs();
});

describe('Listado de cohortes (RF-124)', () => {
  it('muestra cada cohorte con su estado, periodo y el resumen por estado', () => {
    const html = withDemoList();

    for (const name of ['Cohorte Piloto A', 'Cohorte Piloto B', 'Cohorte Piloto C']) {
      expect(html).toContain(name);
    }
    expect(html).toContain('3 cohortes');
    expect(html).toContain('· 1 activa');
    expect(html).toContain('· 1 en borrador');
    expect(html).toContain('· 1 inactiva');
    expect(html.match(/<article/g)).toHaveLength(3);
    expect(html).toContain('<time dateTime="2026-02-02">2 de feb de 2026</time>');
  });

  it('identifica los datos ficticios como demostración', () => {
    expect(withDemoList()).toMatch(/role="note"[\s\S]*Datos de demostración/);
  });

  it('estado de carga: aviso accesible y sin tarjetas', () => {
    const html = render({ isLoading: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/role="status"[^>]*>Cargando cohortes/);
    expect(html).not.toContain('<article');
  });

  it('estado vacío: lo dice sin ofrecer acciones inexistentes', () => {
    const html = render({});

    expect(html).toMatch(/role="status"[\s\S]*Aún no hay cohortes/);
    expect(html).not.toContain('<button');
  });

  it('estado de error: alerta con reintento, sin datos ficticios', () => {
    const html = render({ loadError: 'No pudimos cargar las cohortes. Intenta nuevamente.' });

    expect(html).toMatch(/role="alert"[\s\S]*No pudimos cargar las cohortes/);
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('Cohorte Piloto');
    expect(html).not.toContain('Aún no hay cohortes');
  });

  it('integración pendiente: lo indica y no muestra listado ni datos', () => {
    const html = render({ isIntegrationPending: true });

    expect(html).toContain('Integración pendiente');
    expect(html).not.toContain('Todas las cohortes');
    expect(html).not.toContain('Cohorte Piloto');
  });

  it('sin acciones de escritura: ni crear, editar, activar ni formularios', () => {
    const html = withDemoList();

    expect(html).not.toMatch(/<button|<form|<input|<select|<textarea/);
    expect(html).not.toMatch(/Crear|Editar|Activar|Inactivar|Eliminar|Asignar/);
  });

  it('sin datos personales ni clínicos', () => {
    expect(withDemoList()).not.toMatch(/@|correo|email|dependencia|craving/i);
  });

  it('un único h1 y sin <main> propio: el layout lo aporta', () => {
    const html = withDemoList();

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });
});

describe('Listado de cohortes con el hook real', () => {
  it('con el modo de demostración desactivado no hay datos ficticios', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', '');
    const html = render();

    expect(html).toContain('Integración pendiente');
    expect(html).not.toContain('Cohorte Piloto');
    expect(html).not.toContain('Datos de demostración');
  });

  it('en producción tampoco, aunque exista la variable', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_M08_DEMO', 'true');
    const html = render();

    expect(html).toContain('Integración pendiente');
    expect(html).not.toContain('Datos de demostración');
  });

  it('con el modo de demostración activo empieza cargando y lo identifica', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'true');
    const html = render();

    expect(html).toContain('Datos de demostración');
    expect(html).toMatch(/role="status"[^>]*>Cargando cohortes/);
  });
});
