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

const COHORT_B = DEMO_COHORTS[1];
const PARTICIPANTS_B = DEMO_PARTICIPANTS.filter(
  ({ cohortId }) => cohortId === COHORT_B.id,
);

const DETAIL = Object.freeze({
  cohort: COHORT_B,
  participants: PARTICIPANTS_B,
  participationCounts: countParticipantsByStatus(PARTICIPANTS_B),
  isLoading: false,
  loadError: '',
  notFound: false,
  participantsError: '',
  isDemo: true,
  isIntegrationPending: false,
  canManage: true,
  retry: vi.fn(),
  addParticipants: vi.fn(),
  removeParticipant: vi.fn(),
});

function render(changes = {}) {
  detail.value = { ...DETAIL, ...changes };
  return renderToStaticMarkup(
    <MemoryRouter
      initialEntries={[`/app/administrativo/cohortes/${COHORT_B.id}`]}
    >
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
});

describe('Enlace «Ver efectividad de notificaciones» desde la cohorte (RF-134)', () => {
  it('enlaza a la vista de esa cohorte, identificándola para lectores de pantalla', () => {
    expect(render()).toMatch(
      /<a [^>]*href="\/app\/administrativo\/cohortes\/demo-cohorte-b\/vista-notificaciones"[^>]*>.*Ver efectividad de notificaciones<span class="sr-only"> de Cohorte Piloto B<\/span><\/a>/,
    );
  });

  it('conserva los enlaces de RF-142, RF-132 y RF-133, en ese orden', () => {
    const html = render();
    const order = [
      'Ver seguimiento',
      'Ver vista agregada',
      'Ver progresión narrativa',
      'Ver efectividad de notificaciones',
    ].map((label) => html.indexOf(label));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    for (const path of ['seguimiento', 'vista-agregada', 'vista-narrativa']) {
      expect(html).toContain(
        `href="/app/administrativo/cohortes/demo-cohorte-b/${path}"`,
      );
    }
  });

  it('no aparece sin cohorte (carga, inexistente o integración pendiente)', () => {
    for (const changes of [
      { isLoading: true },
      { cohort: null, notFound: true },
      { cohort: null, isIntegrationPending: true, isDemo: false },
    ]) {
      expect(render(changes)).not.toContain(
        'Ver efectividad de notificaciones',
      );
    }
  });
});
