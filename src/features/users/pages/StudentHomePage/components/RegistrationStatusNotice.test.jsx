import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { REGISTRATION_STATUS_VIEW } from '@/features/users/services/registrationState.js';

import { RegistrationStatusNotice } from './RegistrationStatusNotice.jsx';

function render(view, estadoRegistro) {
  return renderToStaticMarkup(
    <RegistrationStatusNotice
      view={view}
      estadoRegistro={estadoRegistro}
      onGoToConsent={() => {}}
    />,
  );
}

describe('Aviso del estado de registro en el inicio del estudiante', () => {
  it('REGISTRO_COMPLETO conserva el mensaje y la etiqueta habituales', () => {
    const html = render(REGISTRATION_STATUS_VIEW.COMPLETED, 'REGISTRO_COMPLETO');

    expect(html).toContain('¡Registro completado!');
    expect(html).toContain('REGISTRO_COMPLETO');
    expect(html).toContain('var(--success-bg)');
  });

  it('PENDIENTE_REVISION no dice que el registro está completado', () => {
    const html = render(
      REGISTRATION_STATUS_VIEW.PENDING_REVIEW,
      'PENDIENTE_REVISION',
    );

    expect(html).not.toContain('Registro completado');
    expect(html).not.toContain('REGISTRO_COMPLETO');
    expect(html).toContain('pendiente de revisión');
    expect(html).toContain('PENDIENTE_REVISION');
    // No ofrece finalizar la revisión desde una pantalla sin datos.
    expect(html).not.toContain('<button');
  });

  it('PENDIENTE_CONSENTIMIENTO ofrece ir al consentimiento', () => {
    const html = render(
      REGISTRATION_STATUS_VIEW.PENDING_CONSENT,
      'PENDIENTE_CONSENTIMIENTO',
    );

    expect(html).not.toContain('Registro completado');
    expect(html).toContain('Revisar consentimiento');
  });

  it('un estado desconocido no se presenta como completado', () => {
    const html = render(REGISTRATION_STATUS_VIEW.UNKNOWN, null);

    expect(html).not.toContain('Registro completado');
    expect(html).not.toContain('REGISTRO_COMPLETO');
    expect(html).toContain('SIN CONFIRMAR');
  });
});

describe('Sesión con alcance limitado', () => {
  it('no afirma registro completado ni consentimiento pendiente', () => {
    const html = render(
      REGISTRATION_STATUS_VIEW.LIMITED_SESSION,
      'REGISTRO_COMPLETO',
    );

    expect(html).not.toContain('Registro completado');
    expect(html).not.toContain('consentimiento');
    expect(html).not.toContain('<button');
    expect(html).toContain('SESIÓN LIMITADA');
    expect(html).toContain('vuelve a ingresar');
  });
});
