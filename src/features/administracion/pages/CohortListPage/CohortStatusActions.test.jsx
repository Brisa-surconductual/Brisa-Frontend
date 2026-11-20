import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { CohortCard } from '../../components/CohortCard/index.js';
import { DEMO_COHORTS } from '../../data/cohortDemoData.js';
import { countCohortsByStatus } from '../../services/cohortSummary.js';
import { CohortListPage } from './CohortListPage.jsx';

const list = vi.hoisted(() => ({ value: null }));
const actions = vi.hoisted(() => ({ value: null }));

vi.mock('./hooks/useCohortList.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useCohortList: () => list.value ?? actual.useCohortList() };
});

vi.mock('./hooks/useCohortStatusActions.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCohortStatusActions: (args) => actions.value ?? actual.useCohortStatusActions(args),
  };
});

const LIST = Object.freeze({
  cohorts: DEMO_COHORTS,
  statusCounts: countCohortsByStatus(DEMO_COHORTS),
  isLoading: false,
  loadError: '',
  isDemo: true,
  isIntegrationPending: false,
  canManage: true,
  retry: vi.fn(),
  replaceCohort: vi.fn(),
});

const ACTIONS = Object.freeze({
  busyIds: [],
  notice: null,
  noticeRef: { current: null },
  pendingInactivation: null,
  requestActivation: vi.fn(),
  requestInactivation: vi.fn(),
  cancelInactivation: vi.fn(),
  confirmInactivation: vi.fn(),
});

function render({ listChanges = {}, actionChanges = {} } = {}) {
  list.value = { ...LIST, ...listChanges };
  actions.value = { ...ACTIONS, ...actionChanges };
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/app/administrativo/cohortes']}>
      <CohortListPage />
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

// HTML de la tarjeta de una cohorte por su nombre.
const cardOf = (html, name) =>
  (html.split('<article').find((chunk) => chunk.includes(`>${name}</h3>`)) ?? '').split('</article>')[0];

const textOf = (html) => html.replace(/<[^>]+>/g, '');

afterEach(() => {
  list.value = null;
  actions.value = null;
});

describe('Acciones de estado en el listado (RF-124)', () => {
  it('cada estado ofrece solo su acción: Activar en borrador, Inactivar en activa, nada en inactiva', () => {
    const html = render();

    expect(cardOf(html, 'Cohorte Piloto A')).toContain('Activar<span class="sr-only"> Cohorte Piloto A</span>');
    expect(cardOf(html, 'Cohorte Piloto A')).not.toContain('Inactivar');
    expect(cardOf(html, 'Cohorte Piloto B')).toContain('Inactivar<span class="sr-only"> Cohorte Piloto B</span>');
    expect(cardOf(html, 'Cohorte Piloto B')).not.toMatch(/>Activar</);
    expect(cardOf(html, 'Cohorte Piloto C')).not.toMatch(/Activar|Inactivar/);
    expect(cardOf(html, 'Cohorte Piloto C')).toContain('Editar');
  });

  it('sin el modo de demostración no hay acciones de estado', () => {
    const html = render({ listChanges: { isDemo: false, canManage: false } });

    expect(html).not.toMatch(/Activar|Inactivar/);
    expect(html).not.toContain('<dialog');
  });

  it('con la integración pendiente tampoco', () => {
    const html = render({ listChanges: { isDemo: false, canManage: false, isIntegrationPending: true, cohorts: [] } });

    expect(html).not.toMatch(/Activar|Inactivar/);
  });

  it('la cohorte en proceso muestra el estado de la acción y no se puede pulsar', () => {
    const card = cardOf(render({ actionChanges: { busyIds: ['demo-cohorte-a'] } }), 'Cohorte Piloto A');

    expect(card).toContain('Activando...');
    expect(card).toMatch(/<button[^>]*disabled=""[^>]*aria-busy="true"/);
  });

  it('los contadores y las insignias siguen los estados actuales', () => {
    const cohorts = DEMO_COHORTS.map((cohort) =>
      cohort.id === 'demo-cohorte-a' ? { ...cohort, status: 'ACTIVA' } : cohort,
    );
    const html = render({ listChanges: { cohorts, statusCounts: countCohortsByStatus(cohorts) } });

    expect(textOf(html)).toContain('3 cohortes · 2 activas · 1 inactiva');
    expect(html).not.toContain('en borrador');
    expect(cardOf(html, 'Cohorte Piloto A')).toContain('<span class="sr-only">Estado: </span>Activa');
    expect(cardOf(html, 'Cohorte Piloto A')).toContain('Inactivar');
  });
});

describe('Avisos del cambio de estado', () => {
  it.each([
    ['success', 'Cohorte activada temporalmente', 'status'],
    ['warning', 'No se pudo activar la cohorte', 'alert'],
    ['danger', 'No se pudo inactivar la cohorte', 'alert'],
  ])('%s: «%s» con role=%s, enfocable y con el aviso general temporal', (tone, title, role) => {
    const html = render({ actionChanges: { notice: { tone, title, message: 'Detalle del resultado.' } } });

    expect(html).toMatch(new RegExp(`tabindex="-1"[^>]*role="${role}"[\\s\\S]*${title}`, 'i'));
    expect(html).toContain('Detalle del resultado.');
    expect(html).toContain('Los cambios son temporales y no se guardan en el servidor.');
    expect(html).not.toMatch(/guardad[oa] (correctamente|definitivamente)/i);
  });
});

describe('Confirmación de inactivación', () => {
  it('usa el diálogo compartido e identifica la cohorte', () => {
    const html = render({ actionChanges: { pendingInactivation: DEMO_COHORTS[1] } });

    expect(html).toMatch(/<dialog[^>]*aria-labelledby/);
    expect(html).toContain('¿Inactivar «Cohorte Piloto B»?');
    expect(html).toContain('La cohorte pasará a estado Inactiva.');
    expect(html).toContain('Los cambios son temporales y no se guardan en el servidor.');
    expect(html).toContain('Inactivar cohorte');
    expect(html).toContain('Cancelar');
  });
});

describe('Botón de estado en la tarjeta', () => {
  it('nombra la cohorte para lectores de pantalla y llama a su acción', () => {
    const onClick = vi.fn();
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CohortCard
          cohort={DEMO_COHORTS[0]}
          statusAction={{ label: 'Activar', busyLabel: 'Activando...', busy: false, onClick }}
        />
      </MemoryRouter>,
    ).replaceAll('<!-- -->', '');

    expect(html).toMatch(/<button type="button"[^>]*>Activar<span class="sr-only"> Cohorte Piloto A<\/span><\/button>/);
    expect(html).toContain('min-h-[44px]');
  });
});

describe('Acceso a los participantes desde el listado (RF-125)', () => {
  it('cada tarjeta enlaza a su detalle sin quitar Editar ni la acción de estado', () => {
    const html = render();

    for (const { id, name } of DEMO_COHORTS) {
      const card = cardOf(html, name);

      expect(card).toContain(`href="/app/administrativo/cohortes/${id}"`);
      expect(card).toContain(`Ver participantes<span class="sr-only"> de ${name}</span>`);
      expect(card).toContain(`href="/app/administrativo/cohortes/${id}/editar"`);
    }
    expect(cardOf(html, 'Cohorte Piloto A')).toContain('Activar<span class="sr-only">');
    expect(cardOf(html, 'Cohorte Piloto B')).toContain('Inactivar<span class="sr-only">');
    expect(textOf(html)).toContain('3 cohortes · 1 activa · 1 en borrador · 1 inactiva');
  });

  it('el enlace codifica el identificador de una cohorte temporal', () => {
    const temporary = { ...DEMO_COHORTS[0], id: 'demo-temporal-1', name: 'Cohorte temporal' };
    const html = render({ listChanges: { cohorts: [temporary], statusCounts: countCohortsByStatus([temporary]) } });

    expect(cardOf(html, 'Cohorte temporal')).toContain('href="/app/administrativo/cohortes/demo-temporal-1"');
  });
});
