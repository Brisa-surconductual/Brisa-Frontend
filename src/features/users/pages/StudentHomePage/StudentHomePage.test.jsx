import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { REGISTRATION_STATUS_VIEW } from '@/features/users/services/registrationState.js';

import { StudentHomePage } from './StudentHomePage.jsx';

let homeState;

vi.mock('./hooks/useStudentHomePage.js', () => ({
  useStudentHomePage: () => homeState,
}));

vi.mock('@/features/cronograma/components/CurrentContentAccessCard/index.js', () => ({
  CurrentContentAccessCard: () => <section>tarjeta-contenido-actual</section>,
}));

function render(state) {
  homeState = {
    displayName: 'estudiante.qa',
    roleLabel: 'Estudiante',
    estadoRegistro: 'REGISTRO_COMPLETO',
    registrationStatusView: REGISTRATION_STATUS_VIEW.COMPLETED,
    goToConsent: () => {},
    handleLogout: () => {},
    ...state,
  };

  return renderToStaticMarkup(<StudentHomePage />);
}

describe('Inicio del estudiante dentro del StudentLayout', () => {
  it('conserva saludo, aviso de estado, contenido actual y módulos', () => {
    const html = render();

    expect(html).toContain('Hola, estudiante.qa</h1>');
    expect(html).toContain('¡Registro completado!');
    expect(html).toContain('tarjeta-contenido-actual');
    expect(html).toContain('Módulos del programa');
    expect(html).toContain('próximamente');
  });

  it.each([
    [REGISTRATION_STATUS_VIEW.LIMITED_SESSION, 'REGISTRO_COMPLETO', 'Tu sesión necesita actualizarse'],
    [REGISTRATION_STATUS_VIEW.PENDING_CONSENT, 'PENDIENTE_CONSENTIMIENTO', 'Falta aceptar el consentimiento informado'],
    [REGISTRATION_STATUS_VIEW.PENDING_REVIEW, 'PENDIENTE_REVISION', 'Tu registro está pendiente de revisión'],
    [REGISTRATION_STATUS_VIEW.UNKNOWN, null, 'No pudimos confirmar el estado de tu registro'],
  ])('conserva el aviso real del estado (%s)', (view, estado, text) => {
    const html = render({ registrationStatusView: view, estadoRegistro: estado });

    expect(html).toContain(text);
    expect(html).not.toContain('¡Registro completado!');
  });

  it('no repite encabezado de app, navegación ni <main>', () => {
    const html = render();

    expect(html).not.toContain('<main');
    expect(html).not.toContain('<nav');
    expect(html).not.toContain('Salir');
  });
});
