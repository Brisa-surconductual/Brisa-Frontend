import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { ParticipantTrackingProfilePage } from './ParticipantTrackingProfilePage.jsx';
import { PROFILE_STATUS } from './hooks/useParticipantTrackingProfile.js';

const hook = vi.hoisted(() => ({ value: null }));

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

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

function render(changes = {}) {
  hook.value = { ...BASE, ...changes };
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/app/administrativo/cohortes/c-1/seguimiento/seg-0001']}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento/:referencia" element={<ParticipantTrackingProfilePage />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const exportButton = (html) => html.match(/<button[^>]*aria-haspopup="dialog"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? null;

beforeEach(() => vi.stubEnv('VITE_M08_DEMO', ''));

afterEach(() => {
  hook.value = null;
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('Ficha de seguimiento → exportación CSV individual (RF-145)', () => {
  it('con un seudónimo A7 de una fuente real: acción disponible junto a los accesos de la ficha', () => {
    const html = render();
    const button = exportButton(html);

    expect(button).not.toBeNull();
    expect(button).not.toContain('disabled=""');
    // Junto al acceso a las sesiones del chat, antes de los avisos y los indicadores.
    const sessions = html.indexOf('/chat/participantes/P-1A2B3C4D/sesiones');
    expect(sessions).toBeGreaterThan(-1);
    expect(html.indexOf(button)).toBeGreaterThan(sessions);
    expect(html.indexOf(button)).toBeLessThan(html.indexOf('Información de solo lectura'));
  });

  it('montar la ficha no hace ninguna petición de exportación ni pinta la confirmación', () => {
    const html = render();

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(html).not.toContain('Confirmar exportación');
  });

  it('integración pendiente: visible, deshabilitada y con aviso discreto', () => {
    const html = render({ isIntegrationPending: true, code: null, status: null });

    expect(exportButton(html)).toContain('disabled=""');
    expect(textOf(html)).toContain('Disponible cuando la ficha muestre el código verificado del participante.');
    expect(html).not.toContain('<dialog');
  });

  it('demostración: deshabilitada aunque el código parezca válido; sin exportación real', () => {
    vi.stubEnv('VITE_M08_DEMO', 'true');
    const html = render({ isDemo: true });

    expect(exportButton(html)).toContain('disabled=""');
    expect(textOf(html)).toContain('No disponible en la demostración.');
    expect(html).not.toContain('<dialog');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('la referencia opaca de la ruta nunca se usa como código', () => {
    const html = render({ code: 'seg-0001' });

    expect(exportButton(html)).toContain('disabled=""');
    expect(html).not.toContain('<dialog');
  });

  it.each([
    ['mientras carga', { isLoading: true }],
    ['acceso denegado', { status: PROFILE_STATUS.DENIED, code: null }],
    ['participante no encontrado', { status: PROFILE_STATUS.NOT_FOUND, code: null }],
    ['identidad inconsistente', { status: PROFILE_STATUS.INCONSISTENT, code: null }],
  ])('no se ofrece %s', (_, changes) => {
    expect(exportButton(render(changes))).toBeNull();
  });

  it('con la ficha confirmada (con o sin perfil) se ofrece', () => {
    expect(exportButton(render({ status: PROFILE_STATUS.READY, profile: null }))).not.toBeNull();
    expect(exportButton(render({ status: PROFILE_STATUS.NO_PROFILE }))).not.toBeNull();
  });
});
