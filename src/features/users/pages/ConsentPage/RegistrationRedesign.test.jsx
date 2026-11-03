import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Outlet } from 'react-router-dom';

import { RegistrationLayout } from '@/app/layouts/RegistrationLayout/RegistrationLayout.jsx';
import { RegistrationProvider } from '@/features/users/context/RegistrationProvider.jsx';

import { findAll, hookStub, renderDirect } from '../../test-utils/hookHarness.js';
import { ConsentDocument } from '../../components/ConsentDocument/ConsentDocument.jsx';
import { RegistrationStepper } from '../../components/RegistrationStepper/RegistrationStepper.jsx';
import { useCreateAccountPage } from '../CreateAccountPage/hooks/useCreateAccountPage.js';
import { CreateAccountPage } from '../CreateAccountPage/CreateAccountPage.jsx';
import { ReconsentPage } from '../ReconsentPage/ReconsentPage.jsx';
import { useConsentPage } from './hooks/useConsentPage.js';
import { ConsentPage } from './ConsentPage.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  saveAccount: vi.fn(),
  saveConsent: vi.fn(),
  registration: {},
  auth: {},
  consentView: null,
  reconsentView: null,
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/hookHarness.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../hooks/useRegistration.js', () => ({
  useRegistration: () => ({
    saveAccount: mocks.saveAccount,
    saveConsent: mocks.saveConsent,
    resetRegistration: vi.fn(),
    ...mocks.registration,
  }),
}));

vi.mock('@/app/providers/index.js', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../../../app/providers/index.js', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../api/obtenerConsetimiento.jsx', () => ({ obtenerConsentimiento: vi.fn() }));
vi.mock('../../api/validacionConsetimeinto.jsx', () => ({ validarConsentimiento: vi.fn() }));
vi.mock('../../api/sesion.jsx', () => ({ sesionActual: vi.fn() }));

vi.mock('./hooks/useConsentPage.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useConsentPage: () => mocks.consentView ?? actual.useConsentPage() };
});
vi.mock('../ReconsentPage/hooks/useReconsentPage.js', () => ({
  useReconsentPage: () => mocks.reconsentView,
}));

const CONSENT = Object.freeze({
  idConsentimeinto: 'qa-consent',
  titulo: 'Consentimiento informado QA',
  versionConsetimeinto: '2026-10',
  urlContenido: 'Primera línea del documento: «texto legal» sin cambios.\nSegunda línea, con acentos: á é í ó ú ñ.',
});
const event = () => ({ preventDefault: vi.fn() });
const markup = (node) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

// Índices de useState en useConsentPage.
const C = Object.freeze({ authorizations: 0, attempted: 1, submitError: 2, cancelOpen: 4, consentData: 7, loading: 8 });

const consentView = (extra) => ({
  account: { email: 'qa@example.com' }, isFromLogin: false, consentData: CONSENT, isLoadingConsent: false,
  authorizations: { personalDataAccepted: false, consumptionHistoryAccepted: false }, attemptedSubmit: false,
  submitError: '', successMessage: '', isSubmitting: false, cancelDialogOpen: false, isCancelling: false,
  consentIsComplete: false, handleAuthorizationChange: vi.fn(), handleSubmit: vi.fn(),
  handleCancelRegistration: vi.fn(), openCancelDialog: vi.fn(), closeCancelDialog: vi.fn(), ...extra,
});

beforeEach(() => {
  Object.values(mocks).forEach((value) => value?.mockReset?.());
  mocks.registration = {};
  mocks.auth = {};
  mocks.consentView = null;
  mocks.reconsentView = null;
  globalThis.document = { getElementById: () => ({ focus: vi.fn() }) };
  globalThis.requestAnimationFrame = (callback) => callback();
});

afterEach(() => {
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
});

describe('RegistrationLayout (CP-04)', () => {
  it('conserva el proveedor, un único <main> y el Outlet', () => {
    const tree = RegistrationLayout();

    expect(tree.type).toBe(RegistrationProvider);
    expect(findAll(tree, (el) => el.type === 'main')).toHaveLength(1);
    expect(findAll(tree, (el) => el.type === Outlet)).toHaveLength(1);
  });
});

describe('Crear cuenta (CP-05)', () => {
  it('conserva campos, etiquetas, fortaleza e indicador en el paso 1', () => {
    const html = markup(<CreateAccountPage />);

    for (const id of ['email', 'password', 'confirmPassword']) {
      expect(html).toMatch(new RegExp(`<label[^>]*for="${id}"`));
    }
    expect(html).toMatch(/aria-current="step"[\s\S]*?>1</);
    expect(html).toContain('Paso 1 de 4');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });

  it('con errores no guarda la cuenta ni avanza', async () => {
    const { handleSubmit } = renderDirect(() => useCreateAccountPage(), {
      0: { email: 'qa@example.com', password: 'corta', confirmPassword: 'otra' },
    });

    await handleSubmit(event());
    expect(mocks.saveAccount).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(hookStub.setters[1]).toHaveBeenCalled();
  });

  it('con datos válidos guarda la cuenta en memoria y continúa al consentimiento', async () => {
    const { handleSubmit } = renderDirect(() => useCreateAccountPage(), {
      0: { email: 'qa@example.com', password: 'Brisa#2026', confirmPassword: 'Brisa#2026' },
    });

    await handleSubmit(event());
    expect(mocks.saveAccount).toHaveBeenCalledWith({ email: 'qa@example.com', password: 'Brisa#2026' });
    expect(mocks.navigate).toHaveBeenCalledWith('/registro/consentimiento', { replace: true });
  });

  it('CP-07 un envío en curso no se repite', async () => {
    const { handleSubmit } = renderDirect(() => useCreateAccountPage(), {
      0: { email: 'qa@example.com', password: 'Brisa#2026', confirmPassword: 'Brisa#2026' },
      3: true,
    });

    await handleSubmit(event());
    expect(mocks.saveAccount).not.toHaveBeenCalled();
  });
});

describe('Consentimiento', () => {
  it('CP-08 conserva el texto legal línea por línea y su versión', () => {
    const html = renderToStaticMarkup(
      <ConsentDocument titulo={CONSENT.titulo} contenido={CONSENT.urlContenido} version={CONSENT.versionConsetimeinto} />,
    );

    expect(html).toContain('<p class="m-0 mb-[var(--space-3)]">Primera línea del documento: «texto legal» sin cambios.</p>');
    expect(html).toContain('<p class="m-0 mb-[var(--space-3)]">Segunda línea, con acentos: á é í ó ú ñ.</p>');
    expect(html).toContain('Versión 2026-10');
    expect(html).toMatch(/tabindex="0" role="region" aria-label="Texto del consentimiento informado"/);
  });

  it('CP-09 las dos autorizaciones cambian de forma independiente', () => {
    const { handleAuthorizationChange } = renderDirect(() => useConsentPage(), { [C.consentData]: CONSENT, [C.loading]: false });

    handleAuthorizationChange({ target: { name: 'personalDataAccepted', checked: true } });
    const update = hookStub.setters[C.authorizations].mock.calls[0][0];
    expect(update({ personalDataAccepted: false, consumptionHistoryAccepted: false })).toEqual({
      personalDataAccepted: true,
      consumptionHistoryAccepted: false,
    });

    mocks.consentView = consentView();
    const html = markup(<ConsentPage />);
    expect(html).toMatch(/id="personalDataAccepted"/);
    expect(html).toMatch(/id="consumptionHistoryAccepted"/);
  });

  it('CP-10 no continúa sin ambas autorizaciones', async () => {
    mocks.registration = { account: { email: 'qa@example.com' } };
    const incomplete = renderDirect(() => useConsentPage(), {
      [C.authorizations]: { personalDataAccepted: true, consumptionHistoryAccepted: false },
      [C.consentData]: CONSENT,
    });

    await incomplete.handleSubmit(event());
    expect(hookStub.setters[C.attempted]).toHaveBeenCalledWith(true);
    expect(mocks.saveConsent).not.toHaveBeenCalled();

    const complete = renderDirect(() => useConsentPage(), {
      [C.authorizations]: { personalDataAccepted: true, consumptionHistoryAccepted: true },
      [C.consentData]: CONSENT,
    });
    await complete.handleSubmit(event());
    expect(mocks.saveConsent).toHaveBeenCalledWith(expect.objectContaining({
      personalDataAccepted: true,
      consumptionHistoryAccepted: true,
      consentVersion: '2026-10',
      idConsentimeinto: 'qa-consent',
    }));
    expect(mocks.navigate).toHaveBeenCalledWith('/registro/linea-base');
  });

  it('CP-10 el error del grupo queda anunciado y ligado', () => {
    mocks.consentView = consentView({ attemptedSubmit: true });
    const html = markup(<ConsentPage />);

    expect(html).toMatch(/aria-describedby="consent-authorizations-error"/);
    expect(html).toMatch(/id="consent-authorizations-error"[^>]*role="alert">Debes aceptar ambas autorizaciones/);
  });

  it('CP-11 cancelar abre la confirmación existente', () => {
    const { openCancelDialog } = renderDirect(() => useConsentPage(), { [C.consentData]: CONSENT });
    openCancelDialog();
    expect(hookStub.setters[C.cancelOpen]).toHaveBeenCalledWith(true);

    mocks.consentView = consentView({ cancelDialogOpen: true });
    const html = markup(<ConsentPage />);
    expect(html).toContain('¿Cancelar el registro?');
    expect(html).toContain('Sí, cancelar');
    expect(html).toMatch(/aria-label="Cancelar registro y volver"/);
  });

  it('desde el login conserva su variante sin indicador de etapas', () => {
    mocks.consentView = consentView({ isFromLogin: true, successMessage: 'Consentimiento validado correctamente.' });
    const html = markup(<ConsentPage />);

    expect(html).toContain('Nuevo Consentimiento</h1>');
    expect(html).not.toContain('Progreso del registro');
    expect(html).toMatch(/role="status"[\s\S]*Consentimiento validado correctamente\./);
    expect(html).not.toMatch(/green-\d00/);
  });

  it('sin cuenta redirige a crear cuenta', () => {
    mocks.consentView = consentView({ account: null });
    const tree = ConsentPage();

    expect(tree.props.to).toBe('/registro/cuenta');
  });
});

describe('Reconsentimiento (CP-12)', () => {
  const base = { account: {}, consent: {}, baseline: {}, shouldRedirectToReview: false };

  it.each([
    [{ ...base, account: null }, '/registro/cuenta'],
    [{ ...base, consent: null }, '/registro/consentimiento'],
    [{ ...base, baseline: null }, '/registro/linea-base'],
    [{ ...base, shouldRedirectToReview: true }, '/registro/revision'],
  ])('conserva sus restricciones de acceso (%#)', (view, path) => {
    mocks.reconsentView = view;
    expect(ReconsentPage().props.to).toBe(path);
  });
});

describe('Indicador de etapas', () => {
  it('conserva 4 pasos, el actual y el estado completado con texto', () => {
    const html = renderToStaticMarkup(<RegistrationStepper currentStep={3} />);

    expect(html.match(/<li/g)).toHaveLength(4);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html.match(/\(completado\)/g)).toHaveLength(2);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<a ');
  });
});
