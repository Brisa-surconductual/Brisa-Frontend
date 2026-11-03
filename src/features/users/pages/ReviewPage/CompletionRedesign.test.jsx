import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { findAll, hookStub, renderDirect } from '../../test-utils/hookHarness.js';
import { ReviewCard } from '../../components/ReviewCard/ReviewCard.jsx';
import {
  ACADEMIC_LEVEL_OPTIONS,
  CONSUMPTION_REASON_OPTIONS,
} from '../../types/baselineCatalogs.js';
import { INITIAL_BASELINE } from '../BaselinePage/utils/baselineForm.js';
import { useBaselineForm } from '../BaselinePage/hooks/useBaselineForm.js';
import { BaselinePage } from '../BaselinePage/BaselinePage.jsx';
import { RegistrationCompletedPage } from '../RegistrationCompletedPage/RegistrationCompletedPage.jsx';
import { REGISTRATION_OUTCOME } from './utils/completeRegistration.js';
import { useReviewPage } from './hooks/useReviewPage.js';
import { ReviewPage } from './ReviewPage.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  complete: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  saveAccount: vi.fn(),
  saveBaseline: vi.fn(),
  registration: {},
  auth: {},
  reviewView: null,
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/hookHarness.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/registro/revision', state: null }),
}));

vi.mock('@/app/providers/index.js', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../hooks/useRegistration.js', () => ({
  useRegistration: () => ({
    saveAccount: mocks.saveAccount,
    saveBaseline: mocks.saveBaseline,
    saveEditedBaseline: vi.fn(),
    startReviewEdit: vi.fn(),
    modifiedFields: [],
    ...mocks.registration,
  }),
}));
vi.mock('../../api/resgistratio.jsx', () => ({ registroUsuario: vi.fn() }));
vi.mock('../../api/sesion.jsx', () => ({ sesionActual: vi.fn() }));
vi.mock('./utils/completeRegistration.js', async (importOriginal) => ({
  ...(await importOriginal()),
  completeRegistration: (...args) => mocks.complete(...args),
}));
vi.mock('./hooks/useReviewPage.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useReviewPage: () => mocks.reviewView ?? actual.useReviewPage() };
});

const ACCOUNT = Object.freeze({ email: 'qa@example.com', password: 'Brisa#2026' });
const BASELINE = Object.freeze({
  age: '2004-05-10', educationalInstitution: 'Universidad QA', academicProgram: 'Psicología',
  semester: '3', academicLevel: ACADEMIC_LEVEL_OPTIONS[0].value, city: 'Neiva',
  consumptionStartDate: '2024-01-01', consumptionReason: CONSUMPTION_REASON_OPTIONS[0].value,
  lastConsumptionDate: '2026-10-01', consumptionFrequency: '3',
});
const markup = (node) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

beforeEach(() => {
  Object.values(mocks).forEach((value) => value?.mockReset?.());
  mocks.registration = { account: ACCOUNT, consent: { status: 'VIGENTE' }, baseline: BASELINE };
  mocks.auth = { login: mocks.login, logout: mocks.logout, waitForSessionEnd: async () => {}, isAuthenticated: true };
  mocks.reviewView = null;
  globalThis.document = { getElementById: () => ({ focus: vi.fn() }), querySelector: () => null };
  globalThis.requestAnimationFrame = (callback) => callback();
});

afterEach(() => {
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
});

describe('Línea base', () => {
  it('CP-13 conserva todas las preguntas con etiqueta y las opciones de los catálogos', () => {
    mocks.registration = { account: ACCOUNT, consent: { status: 'VIGENTE' }, baseline: null };
    const html = markup(<BaselinePage />);

    for (const field of Object.keys(INITIAL_BASELINE)) {
      expect(html).toMatch(new RegExp(`<label[^>]*for="${field}"`));
    }
    for (const { label } of [...ACADEMIC_LEVEL_OPTIONS, ...CONSUMPTION_REASON_OPTIONS]) {
      expect(html).toContain(label);
    }
    expect(html).toContain('Paso 3 de 4');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('CP-14 un formulario vacío no se guarda ni avanza', async () => {
    mocks.registration = { account: ACCOUNT, consent: { status: 'VIGENTE' }, baseline: null };
    const { handleSubmit } = renderDirect(() => useBaselineForm());

    await handleSubmit({ preventDefault: vi.fn() });
    expect(mocks.saveBaseline).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(hookStub.setters[1]).toHaveBeenCalled();
  });

  it('CP-14 conserva las redirecciones sin cuenta o sin consentimiento', () => {
    mocks.registration = { account: null };
    expect(markup(<BaselinePage />)).toBe('');
    mocks.registration = { account: ACCOUNT, consent: null };
    expect(markup(<BaselinePage />)).toBe('');
  });
});

describe('Revisión', () => {
  it('CP-15 muestra los datos realmente disponibles y no la contraseña', () => {
    const html = markup(<ReviewPage />);

    expect(html).toContain('qa@example.com');
    expect(html).toContain('Universidad QA');
    expect(html).toContain('Neiva');
    expect(html).not.toContain('Brisa#2026');
    expect(html).toContain('La contraseña no se muestra ni puede consultarse desde esta pantalla.');
    expect(html).toMatch(/Editar<\/span><span class="sr-only"> Datos académicos/);
  });

  it('CP-16 un dato vacío se muestra como ausente, sin inventarlo', () => {
    const html = renderToStaticMarkup(<ReviewCard title="Cuenta" rows={[{ label: 'Ciudad', value: '' }]} />);

    expect(html).toMatch(/Ciudad<\/dt><dd[^>]*>—/);
  });

  it('CP-16 sin línea base en memoria no muestra la revisión', () => {
    mocks.registration = { account: ACCOUNT, consent: { status: 'VIGENTE' }, baseline: null };
    expect(markup(<ReviewPage />)).toBe('');
  });

  it.each([
    [REGISTRATION_OUTCOME.CREATION_REJECTED, { error: { response: { data: { message: 'Correo ya registrado.' } } } }, false],
    [REGISTRATION_OUTCOME.CREATION_UNCERTAIN, {}, false],
    [REGISTRATION_OUTCOME.SESSION_READY, { createdAccount: {}, session: { correoElectronico: 'qa@example.com', rol: 'ESTUDIANTE' } }, true],
    [REGISTRATION_OUTCOME.SESSION_UNAVAILABLE, { createdAccount: {} }, true],
  ])('CP-06 conserva el resultado %s', async (outcome, extra, completes) => {
    mocks.complete.mockResolvedValue({ outcome, ...extra });
    const { handleConfirmation } = renderDirect(() => useReviewPage());

    await handleConfirmation();

    expect(mocks.complete).toHaveBeenCalledTimes(1);
    if (completes) {
      expect(mocks.navigate).toHaveBeenCalledWith('/registro/completado', { replace: true });
    } else {
      expect(mocks.navigate).not.toHaveBeenCalled();
      expect(hookStub.setters[0]).toHaveBeenCalled();
    }
    expect(mocks.login).toHaveBeenCalledTimes(outcome === REGISTRATION_OUTCOME.SESSION_READY ? 1 : 0);
    expect(mocks.logout).toHaveBeenCalledTimes(outcome === REGISTRATION_OUTCOME.SESSION_UNAVAILABLE ? 1 : 0);
  });

  it('CP-07 un doble clic no duplica la creación', async () => {
    let resolve;
    mocks.complete.mockReturnValue(new Promise((done) => { resolve = done; }));
    const { handleConfirmation } = renderDirect(() => useReviewPage());

    const first = handleConfirmation();
    await handleConfirmation();
    resolve({ outcome: REGISTRATION_OUTCOME.CREATION_UNCERTAIN });
    await first;

    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });
});

describe('Registro completado (CP-17)', () => {
  it('sin registro completo redirige a crear cuenta', () => {
    mocks.registration = { account: { email: 'qa@example.com', registrationStatus: 'PENDIENTE_REVISION' } };
    expect(markup(<RegistrationCompletedPage />)).toBe('');
  });

  it('sin sesión no se presenta como autenticado y pide iniciar sesión', () => {
    mocks.registration = { account: { email: 'qa@example.com', registrationStatus: 'REGISTRO_COMPLETO' } };
    mocks.auth = { isAuthenticated: false };
    const tree = renderDirect(RegistrationCompletedPage);
    const html = markup(tree);

    expect(html).toMatch(/role="status"[\s\S]*no pudimos iniciar tu sesión/);
    expect(html).toContain('Iniciar sesión');
    expect(html.match(/<h1/g)).toHaveLength(1);
    findAll(tree, (el) => el.props?.onClick && el.props?.size === 'large')[0].props.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('con sesión continúa a la aplicación', () => {
    mocks.registration = { account: { email: 'qa@example.com', registrationStatus: 'REGISTRO_COMPLETO' } };
    const tree = renderDirect(RegistrationCompletedPage);

    findAll(tree, (el) => el.props?.onClick && el.props?.size === 'large')[0].props.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith('/app', { replace: true });
  });
});
