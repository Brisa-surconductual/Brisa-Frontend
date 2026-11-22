import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DEMO_COHORTS } from '../../data/cohortDemoData.js';
import { DEMO_PARTICIPANTS } from '../../data/participantDemoData.js';
import { countParticipantsByStatus } from '../../services/participantSummary.js';
import { CohortDetailPage } from './CohortDetailPage.jsx';

const detail = vi.hoisted(() => ({ value: null }));

vi.mock('./hooks/useCohortDetail.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCohortDetail: (args) => detail.value ?? actual.useCohortDetail(args),
  };
});

function render(cohort) {
  const participants = DEMO_PARTICIPANTS.filter(
    ({ cohortId }) => cohortId === cohort?.id,
  );
  detail.value = {
    cohort,
    participants,
    participationCounts: countParticipantsByStatus(participants),
    isLoading: false,
    loadError: '',
    notFound: !cohort,
    participantsError: '',
    isDemo: true,
    isIntegrationPending: false,
    canManage: true,
    retry: vi.fn(),
    addParticipants: vi.fn(),
    removeParticipant: vi.fn(),
  };
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/app/administrativo/cohortes/x']}>
      <Routes>
        <Route
          path="/app/administrativo/cohortes/:idCohorte"
          element={<CohortDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

afterEach(() => {
  detail.value = null;
  vi.unstubAllEnvs();
});

describe('Exportación CSV desde el detalle de la cohorte (RF-144)', () => {
  it('aparece después de las vistas de la cohorte, sin alterar sus accesos', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'true');
    const html = render(DEMO_COHORTS[1]);

    expect(html).toContain('Exportar indicadores CSV');
    expect(html.indexOf('Ver evolución temporal')).toBeLessThan(
      html.indexOf('Exportar indicadores CSV'),
    );
    expect(html).toContain(
      'href="/app/administrativo/cohortes/demo-cohorte-b/vista-agregada"',
    );
  });

  it('una cohorte no activa no permite exportar', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'true');
    const html = render(DEMO_COHORTS[2]);

    expect(html).toContain('Disponible solo para la cohorte activa.');
  });

  it('sin el modo demostración: integración pendiente', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', '');
    const html = render(DEMO_COHORTS[1]);

    expect(html).toContain(
      'Exportación pendiente de integración con el servidor.',
    );
  });

  it('sin cohorte no aparece', () => {
    expect(render(null)).not.toContain('Exportar indicadores CSV');
  });
});
