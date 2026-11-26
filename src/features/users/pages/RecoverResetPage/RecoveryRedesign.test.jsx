import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { hookStub, renderDirect } from '../../test-utils/hookHarness.js';
import { useRecoverRequestPage } from '../RecoverRequestPage/hooks/useRecoverRequestPage.js';
import { RecoverRequestPage } from '../RecoverRequestPage/RecoverRequestPage.jsx';
import { useRecoverResetPage } from './hooks/useRecoverResetPage.js';
import { RecoverResetPage } from './RecoverResetPage.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  location: { state: null },
  solicitar: vi.fn(),
  actualizar: vi.fn(),
  requestState: null,
  resetState: null,
}));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/hookHarness.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useLocation: () => mocks.location,
}));

vi.mock('@/features/users/api/recuperacionContrasena.jsx', () => ({
  solicitarRecuperacionContrasena: (...args) => mocks.solicitar(...args),
  actualizarContrasena: (...args) => mocks.actualizar(...args),
}));

// Las páginas se pintan con un estado controlado del hook.
vi.mock('../RecoverRequestPage/hooks/useRecoverRequestPage.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRecoverRequestPage: () => mocks.requestState ?? actual.useRecoverRequestPage(),
  };
});
vi.mock('./hooks/useRecoverResetPage.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRecoverResetPage: () => mocks.resetState ?? actual.useRecoverResetPage(),
  };
});

const VALID_RESET = Object.freeze({ code: '123456', password: 'Brisa#2026', confirmPassword: 'Brisa#2026' });
const event = () => ({ preventDefault: vi.fn() });
const page = (Component) => renderToStaticMarkup(<MemoryRouter><Component /></MemoryRouter>);
const resetView = (extra) => ({
  justRequested: false, form: { code: '', password: '', confirmPassword: '' }, errors: {},
  submitError: '', isSubmitting: false, remainingMs: 600000, isExpired: false, isCountdownLow: false,
  handleChange: vi.fn(), handleSubmit: vi.fn(), goBack: vi.fn(), ...extra,
});

beforeEach(() => {
  Object.values(mocks).forEach((value) => value?.mockReset?.());
  mocks.location = { state: null };
  mocks.requestState = null;
  mocks.resetState = null;
  globalThis.document = { getElementById: () => ({ focus: vi.fn() }) };
  globalThis.requestAnimationFrame = (callback) => callback();
});

afterEach(() => {
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
});

describe('Solicitud de recuperación (CP-02)', () => {
  it('valida el correo antes de llamar al endpoint', async () => {
    const { handleSubmit } = renderDirect(() => useRecoverRequestPage(), { 0: { email: 'no-es-correo' } });

    await handleSubmit(event());
    expect(mocks.solicitar).not.toHaveBeenCalled();
    expect(hookStub.setters[1]).toHaveBeenCalled();
  });

  it('envía el correo y continúa a la nueva contraseña', async () => {
    mocks.solicitar.mockResolvedValue({});
    const { handleSubmit } = renderDirect(() => useRecoverRequestPage(), { 0: { email: 'qa@example.com' } });

    await handleSubmit(event());
    expect(mocks.solicitar).toHaveBeenCalledWith({ email: 'qa@example.com' });
    expect(mocks.navigate).toHaveBeenCalledWith('/recuperar/nueva', { state: { requestedEmail: 'qa@example.com' } });
  });

  it('no revela si la cuenta existe y conserva el error del servidor', () => {
    mocks.requestState = {
      form: { email: '' }, errors: {}, submitError: 'No pudimos procesar la solicitud en este momento. Intenta nuevamente.',
      isSubmitting: false, handleChange: vi.fn(), handleSubmit: vi.fn(), goBack: vi.fn(),
    };
    const html = page(RecoverRequestPage);

    expect(html).toContain('Por seguridad, no confirmamos si el correo existe en el sistema.');
    expect(html).toMatch(/role="alert"[\s\S]*No pudimos procesar la solicitud en este momento/);
    expect(html).toMatch(/<label[^>]*for="email"/);
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<h1/g)).toHaveLength(1);
  });
});

describe('Restablecimiento (CP-03)', () => {
  it('con código vigente envía código y contraseña y vuelve al login', async () => {
    mocks.actualizar.mockResolvedValue({});
    const { handleSubmit } = renderDirect(() => useRecoverResetPage(), { 0: VALID_RESET, 5: 60000 });

    await handleSubmit(event());
    expect(mocks.actualizar).toHaveBeenCalledWith({ code: '123456', password: 'Brisa#2026' });
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true, state: { passwordReset: true } });
  });

  it('con el código expirado no envía nada', async () => {
    const { handleSubmit, isExpired } = renderDirect(() => useRecoverResetPage(), { 0: VALID_RESET, 5: 0 });

    expect(isExpired).toBe(true);
    await handleSubmit(event());
    expect(mocks.actualizar).not.toHaveBeenCalled();
  });

  it('conserva la cuenta regresiva de 15 minutos y el umbral de aviso', () => {
    const state = renderDirect(() => useRecoverResetPage(), { 5: 20000 });

    expect(hookStub.initials[5]).toBeGreaterThan(14 * 60 * 1000);
    expect(state.isCountdownLow).toBe(true);
    expect(hookStub.effects).toHaveLength(1);
  });

  it('muestra el tiempo, el aviso de envío y el estado expirado con texto', () => {
    mocks.resetState = resetView({ justRequested: true, remainingMs: 125000 });
    const vigente = page(RecoverResetPage);
    expect(vigente).toContain('2:05');
    expect(vigente).toContain('Si el correo está registrado, recibirás un código.');

    mocks.resetState = resetView({ remainingMs: 0, isExpired: true });
    const expirado = page(RecoverResetPage);
    expect(expirado).toMatch(/role="alert"[\s\S]*El código ha expirado/);
    expect(expirado).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    expect(expirado.match(/<main/g)).toHaveLength(1);
  });
});
