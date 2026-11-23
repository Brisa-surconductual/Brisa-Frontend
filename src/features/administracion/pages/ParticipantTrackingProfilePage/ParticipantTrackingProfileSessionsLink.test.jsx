import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ParticipantTrackingProfilePage } from './ParticipantTrackingProfilePage.jsx';
import { PROFILE_STATUS } from './hooks/useParticipantTrackingProfile.js';

const hook = vi.hoisted(() => ({ value: null }));

vi.mock('./hooks/useParticipantTrackingProfile.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParticipantTrackingProfile: (args) => hook.value ?? actual.useParticipantTrackingProfile(args),
  };
});

const BASE = Object.freeze({
  cohort: { id: 'c-1', name: 'Cohorte de prueba' },
  code: 'P-1A2B3C4D',
  profile: null,
  status: PROFILE_STATUS.NO_PROFILE,
  freshness: { stale: false },
  isLoading: false,
  isDemo: false,
  isIntegrationPending: false,
  headingRef: { current: null },
  retry: vi.fn(),
});

const SESSIONS_HREF = 'href="/app/administrativo/chat/participantes/P-1A2B3C4D/sesiones"';

function render(changes) {
  hook.value = { ...BASE, ...changes };
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/app/administrativo/cohortes/c-1/seguimiento/seg-0001']}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento/:referencia" element={<ParticipantTrackingProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  hook.value = null;
});

describe('Ficha RF-128 → sesiones del chat (RF-38)', () => {
  it('solo con un código A7 de una fuente real confirmada ofrece el acceso', () => {
    expect(render({})).toContain(SESSIONS_HREF);
  });

  it.each([
    ['en la demostración', { isDemo: true }],
    ['con la integración pendiente', { isIntegrationPending: true }],
    ['con un código que no es A7', { code: 'PART-0015' }],
    ['sin participante confirmado (acceso denegado)', { status: PROFILE_STATUS.DENIED }],
    ['mientras carga', { isLoading: true }],
  ])('no se ofrece %s', (_, changes) => {
    expect(render(changes)).not.toContain('/chat/participantes/');
  });

  it('nunca usa la referencia opaca de la ruta como código', () => {
    expect(render({ code: null })).not.toContain('seg-0001/sesiones');
  });
});
