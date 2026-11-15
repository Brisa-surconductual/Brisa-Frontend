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
  return { ...actual, useCohortDetail: (args) => detail.value ?? actual.useCohortDetail(args) };
});

const COHORT_B = DEMO_COHORTS[1];
const PARTICIPANTS_B = DEMO_PARTICIPANTS.filter(({ cohortId }) => cohortId === COHORT_B.id);

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
    <MemoryRouter initialEntries={[`/app/administrativo/cohortes/${COHORT_B.id}`]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte" element={<CohortDetailPage />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

afterEach(() => {
  detail.value = null;
});

describe('Enlace «Ver seguimiento» desde la cohorte (RF-142)', () => {
  it('enlaza al seguimiento de esa cohorte, identificándola para lectores de pantalla', () => {
    expect(render()).toMatch(
      /<a [^>]*href="\/app\/administrativo\/cohortes\/demo-cohorte-b\/seguimiento"[^>]*>.*Ver seguimiento<span class="sr-only"> de Cohorte Piloto B<\/span><\/a>/,
    );
  });

  it('se ofrece aunque la cohorte no tenga participantes ni gestión disponible', () => {
    expect(render({ participants: [], participationCounts: countParticipantsByStatus([]), canManage: false })).toContain('Ver seguimiento');
  });

  it('no aparece sin cohorte (carga, inexistente o integración pendiente)', () => {
    for (const changes of [{ isLoading: true }, { cohort: null, notFound: true }, { cohort: null, isIntegrationPending: true, isDemo: false }]) {
      expect(render(changes)).not.toContain('Ver seguimiento');
    }
  });

  it('no cambia las acciones de E5–E7: asignar y retirar siguen disponibles', () => {
    const html = render();

    expect(html).toContain('Asignar participantes');
    expect(html.match(/Retirar<span class="sr-only">/g)).toHaveLength(PARTICIPANTS_B.length);
  });
});
