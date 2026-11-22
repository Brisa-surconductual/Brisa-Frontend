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

describe('Enlace «Ver evolución temporal» desde la cohorte (RF-141)', () => {
  it('enlaza a la evolución de esa cohorte, identificándola para lectores de pantalla', () => {
    expect(render()).toMatch(
      /<a [^>]*href="\/app\/administrativo\/cohortes\/demo-cohorte-b\/evolucion"[^>]*>.*Ver evolución temporal<span class="sr-only"> de Cohorte Piloto B<\/span><\/a>/,
    );
  });

  it('va después de los accesos existentes, que se conservan', () => {
    const html = render();
    const order = [
      'Ver seguimiento',
      'Ver vista agregada',
      'Ver progresión narrativa',
      'Ver efectividad de notificaciones',
      'Ver evolución temporal',
    ].map((label) => html.indexOf(label));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('cinco accesos sin botones sueltos: el quinto ocupa la fila en dos columnas', () => {
    const html = render();

    expect(html).toContain('sm:grid-cols-2 xl:grid-cols-5');
    expect(html).toMatch(
      /sm:max-xl:col-span-2"[^>]*>.*?Ver evolución temporal/s,
    );
  });

  it('no aparece sin cohorte', () => {
    for (const changes of [
      { isLoading: true },
      { cohort: null, notFound: true },
    ]) {
      expect(render(changes)).not.toContain('Ver evolución temporal');
    }
  });
});
