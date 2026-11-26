import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { INITIAL_COHORT_FORM } from '../../utils/cohortFormState.js';
import { CohortFormPage } from './CohortFormPage.jsx';

const state = vi.hoisted(() => ({ value: null, args: null }));

// Por defecto usa el hook real; cada prueba puede fijar un estado.
vi.mock('./hooks/useCohortFormPage.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCohortFormPage: (args) => {
      state.args = args;
      return state.value ?? actual.useCohortFormPage(args);
    },
  };
});

const BASE = Object.freeze({
  isEdit: false,
  form: INITIAL_COHORT_FORM,
  errors: {},
  scheduleOptions: [{ value: 's-1', label: 'Cronograma uno' }],
  hasActiveSchedules: true,
  replacedSchedule: null,
  currentStatus: null,
  isLoading: false,
  loadError: '',
  notFound: false,
  isSubmitting: false,
  submitError: '',
  isDemo: true,
  isIntegrationPending: false,
  handleChange: vi.fn(),
  handleSubmit: vi.fn(),
  handleCancel: vi.fn(),
  retry: vi.fn(),
});

function render(changes, { mode, path = '/app/administrativo/cohortes/nueva' } = {}) {
  state.value = changes ? { ...BASE, ...changes } : null;
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/nueva" element={<CohortFormPage mode={mode} />} />
        <Route path="/app/administrativo/cohortes/:idCohorte/editar" element={<CohortFormPage mode={mode} />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

afterEach(() => {
  state.value = null;
  vi.unstubAllEnvs();
});

describe('Página de creación de cohorte', () => {
  it('presenta la operación, el aviso temporal y el formulario', () => {
    const html = render({});

    expect(html).toMatch(/<h1[^>]*>Nueva cohorte<\/h1>/);
    expect(html).toMatch(/role="note"[\s\S]*Los cambios son temporales y no se guardan en el servidor\./);
    expect(html).toContain('La cohorte se creará en estado Borrador; no se activará automáticamente.');
    expect(html).toContain('<form');
    expect(html).toMatch(/href="\/app\/administrativo\/cohortes"[^>]*>[\s\S]*Volver a cohortes/);
  });

  it('nunca anuncia un guardado definitivo', () => {
    expect(render({})).not.toMatch(/guardad[oa] (correctamente|definitivamente|en el servidor)/i);
  });

  it('pide al hook el modo de creación sin identificador', () => {
    render({});
    expect(state.args).toEqual({ mode: 'create', cohortId: null });
  });
});

describe('Página de edición de cohorte', () => {
  const editPath = '/app/administrativo/cohortes/demo-cohorte-b/editar';

  it('envía el identificador de la ruta y muestra el estado actual sin poder cambiarlo', () => {
    const html = render(
      { isEdit: true, currentStatus: 'ACTIVA', form: { name: 'Cohorte Piloto B', startDate: '2026-03-02', endDate: '2026-06-26', scheduleId: 's-1' } },
      { mode: 'edit', path: editPath },
    );

    expect(state.args).toEqual({ mode: 'edit', cohortId: 'demo-cohorte-b' });
    expect(html).toMatch(/<h1[^>]*>Editar cohorte<\/h1>/);
    expect(html).toContain('Activa');
    expect(html).toContain('value="Cohorte Piloto B"');
    expect(html).toContain('El estado de la cohorte no cambia desde este formulario.');
    expect(html).toContain('Guardar cambios');
  });

  it('identificador inexistente: recurso no encontrado y sin formulario', () => {
    const html = render({ isEdit: true, notFound: true }, { mode: 'edit', path: editPath });

    expect(html).toMatch(/role="alert"[\s\S]*Cohorte no encontrada/);
    expect(html).not.toContain('<form');
  });
});

describe('Estados del formulario', () => {
  it('carga: estado accesible y sin formulario', () => {
    const html = render({ isLoading: true });

    expect(html).toMatch(/role="status"[^>]*>Cargando formulario/);
    expect(html).not.toContain('<form');
  });

  it('error de carga: alerta con reintento y sin formulario', () => {
    const html = render({ loadError: 'No pudimos cargar la información del formulario. Intenta nuevamente.' });

    expect(html).toMatch(/role="alert"[\s\S]*Formulario no disponible/);
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('<form');
  });

  it('error al aplicar cambios: alerta y el formulario sigue disponible', () => {
    const html = render({ submitError: 'No se pudieron aplicar los cambios. Intenta nuevamente.' });

    expect(html).toMatch(/role="alert"[\s\S]*No se aplicaron los cambios/);
    expect(html).toContain('<form');
  });

  it('integración pendiente: sin formulario ni operaciones ficticias', () => {
    const html = render({ isDemo: false, isIntegrationPending: true });

    expect(html).toContain('Información aún no disponible');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('Los cambios son temporales');
  });

  it('un único h1 y sin <main> propio', () => {
    const html = render({});

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });
});

describe('Formulario con el hook real', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción', false, 'true'],
  ])('%s espera el catálogo real antes de mostrar el formulario', (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);
    const html = render();

    expect(html).toContain('Cargando formulario...');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('Modo de demostración');
  });

  it('con el modo de demostración empieza cargando', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'true');
    const html = render();

    expect(html).toContain('Modo de demostración');
    expect(html).toMatch(/role="status"[^>]*>Cargando formulario/);
  });
});
