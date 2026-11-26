import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import { LoginBrandPanel } from './components/LoginBrandPanel.jsx';
import { LoginNotice } from './components/LoginNotice.jsx';
import { LoginPage } from './LoginPage.jsx';

let pageState;

vi.mock('./hooks/useLoginPage.js', () => ({
  useLoginPage: () => pageState,
}));

function baseState(overrides = {}) {
  return {
    form: { email: '', password: '' },
    errors: {},
    wasClosedByInactivity: false,
    remoteLogoutUnconfirmed: false,
    submitError: '',
    isSubmitting: false,
    handleChange: () => {},
    handleSubmit: () => {},
    goBack: () => {},
    goToRecover: () => {},
    goToCreateAccount: () => {},
    ...overrides,
  };
}

function render(state = {}) {
  pageState = baseState(state);

  return renderToStaticMarkup(
    <MemoryRouter
      initialEntries={[
        { pathname: '/login', state: state.passwordReset ? { passwordReset: true } : null },
      ]}
    >
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('Pantalla de inicio de sesión rediseñada', () => {
  beforeEach(() => {
    pageState = baseState();
  });

  it('conserva título, campos y acciones', () => {
    const html = render();

    expect(html).toContain('<h1');
    expect(html).toContain('id="email"');
    expect(html).toContain('id="password"');
    expect(html).toContain('aria-label="Volver"');
    expect(html).toContain('¿Olvidaste tu contraseña?');
    expect(html).toContain('Crear cuenta');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('role="alert"');
  });

  it('incluye el panel de marca como región complementaria', () =>
    expect(render()).toContain('aria-label="Sobre Brisa"'));

  it('muestra los cuatro avisos con su rol accesible', () => {
    const html = render({
      passwordReset: true,
      wasClosedByInactivity: true,
      remoteLogoutUnconfirmed: true,
      submitError: 'Correo o contraseña incorrectos.',
    });

    expect(html).toContain('Contraseña actualizada');
    expect(html).toContain('Cerramos tu sesión por inactividad');
    expect(html).toContain('No pudimos confirmar el cierre de sesión');
    expect(html).toContain('No pudimos iniciar sesión');
    expect(html).toContain('Correo o contraseña incorrectos.');
    expect(html.match(/role="status"/g)).toHaveLength(2);
    expect(html.match(/role="alert"/g)).toHaveLength(2);
  });

  it('durante el envío conserva el indicador de carga', () => {
    const html = render({ isSubmitting: true });

    expect(html).toContain('Iniciando sesión...');
    expect(html).toContain('aria-busy="true"');
  });

  it('muestra los errores de validación de los campos', () => {
    const html = render({
      errors: {
        email: 'Ingresa un correo válido.',
        password: 'Ingresa tu contraseña.',
      },
    });

    expect(html).toContain('Ingresa un correo válido.');
    expect(html).toContain('Ingresa tu contraseña.');
    expect(html.match(/aria-invalid="true"/g)).toHaveLength(2);
  });

  /*
   * Solo los componentes propios del login: BrisaLogo y TextField
   * (shared/) aún traen colores fijos y se corregirán aparte.
   */
  it('el panel de marca y los avisos no usan colores fijos', () => {
    const html = renderToStaticMarkup(
      <>
        <LoginBrandPanel />
        <LoginNotice tone="danger" icon={AlertTriangle} title="Error" role="alert">
          Detalle
        </LoginNotice>
      </>,
    );

    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
  });
});
