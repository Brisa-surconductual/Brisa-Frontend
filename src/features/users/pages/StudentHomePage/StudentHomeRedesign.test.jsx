import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { REGISTRATION_STATUS_VIEW } from '@/features/users/services/registrationState.js';

import { ModuleGrid } from './components/ModuleGrid.jsx';
import { RegistrationStatusNotice } from './components/RegistrationStatusNotice.jsx';
import { useStudentHomePage } from './hooks/useStudentHomePage.js';
import { StudentHomePage } from './StudentHomePage.jsx';
import { STUDENT_MODULES } from './data/studentModules.js';

const auth = vi.hoisted(() => ({ value: {} }));

vi.mock('@/app/providers/index.js', () => ({ useAuth: () => auth.value }));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/features/cronograma/components/CurrentContentAccessCard/index.js', () => ({
  CurrentContentAccessCard: () => <section>tarjeta-contenido-actual</section>,
}));

const session = (extra) => ({
  user: { email: 'ana.qa@example.com' },
  role: 'ESTUDIANTE',
  estadoRegistro: 'REGISTRO_COMPLETO',
  alcance: 'COMPLETA',
  logout: vi.fn(),
  ...extra,
});

const notice = (view, estado) =>
  renderToStaticMarkup(
    <RegistrationStatusNotice view={view} estadoRegistro={estado} onGoToConsent={() => {}} />,
  );

beforeEach(() => {
  auth.value = session();
});

describe('Inicio del estudiante: datos reales de la sesión', () => {
  it('CP-01 saluda con la parte local del correo, sin dominio ni nombres ficticios', () => {
    const html = renderToStaticMarkup(<StudentHomePage />);

    expect(html).toContain('Hola, ana.qa</h1>');
    expect(html).not.toContain('example.com');
  });

  it('CP-02 el estado del registro sale del contexto de autenticación', () => {
    auth.value = session({ estadoRegistro: 'PENDIENTE_REVISION' });
    const state = useStudentHomePage();

    expect(state.estadoRegistro).toBe('PENDIENTE_REVISION');
    expect(state.registrationStatusView).toBe(REGISTRATION_STATUS_VIEW.PENDING_REVIEW);
  });

  it('CP-03 REGISTRO_COMPLETO con sesión limitada no se presenta como completo', () => {
    auth.value = session({ alcance: 'LIMITADA' });
    const html = renderToStaticMarkup(<StudentHomePage />);

    expect(useStudentHomePage().registrationStatusView).toBe(REGISTRATION_STATUS_VIEW.LIMITED_SESSION);
    expect(html).toContain('Tu sesión necesita actualizarse');
    expect(html).toContain('SESIÓN LIMITADA');
    expect(html).not.toContain('¡Registro completado!');
  });

  it('CP-04 consentimiento pendiente conserva su acción', () => {
    const html = notice(REGISTRATION_STATUS_VIEW.PENDING_CONSENT, 'PENDIENTE_CONSENTIMIENTO');

    expect(html).toContain('Falta aceptar el consentimiento informado');
    expect(html).toMatch(/<button[^>]*>Revisar consentimiento<\/button>/);
    expect(html).toContain('var(--warning-bg)');
  });

  it('CP-05 revisión pendiente: sin acción y sin afirmar registro completo', () => {
    const html = notice(REGISTRATION_STATUS_VIEW.PENDING_REVIEW, 'PENDIENTE_REVISION');

    expect(html).toContain('Tu registro está pendiente de revisión');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('Registro completado');
  });

  it('CP-06 estado desconocido: aviso informativo, nunca completado', () => {
    const html = notice(REGISTRATION_STATUS_VIEW.UNKNOWN, undefined);

    expect(html).toContain('No pudimos confirmar el estado de tu registro');
    expect(html).toContain('SIN CONFIRMAR');
    expect(html).toContain('var(--info-bg)');
    expect(html).not.toContain('var(--success-bg)');
  });

  it('el aviso es una sección con nombre y comunica el estado con texto e ícono', () => {
    const html = notice(REGISTRATION_STATUS_VIEW.COMPLETED, 'REGISTRO_COMPLETO');

    expect(html).toMatch(/<section aria-labelledby="estado-cuenta-titulo"/);
    expect(html).toContain('Estado de tu cuenta');
    expect(html).toContain('<svg');
  });
});

describe('Módulos del programa (CP-12)', () => {
  it('conserva catálogo, orden, nombres, descripciones y versión', () => {
    const html = renderToStaticMarkup(<ModuleGrid />);
    const positions = STUDENT_MODULES.map(({ name }) => html.indexOf(`${name}</h3>`));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    for (const { description, release } of STUDENT_MODULES) {
      expect(html).toContain(description);
      expect(html).toContain('Disponible próximamente');
      expect(html).toContain(`Módulo ${release}`);
    }
  });

  it('no ofrece enlaces ni botones funcionales', () => {
    const html = renderToStaticMarkup(<ModuleGrid />);

    expect(html).not.toContain('<a');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('href=');
  });
});

describe('Estructura del inicio (CP-20)', () => {
  it('un solo h1, módulos bajo h2 y sin <main> propio', () => {
    const html = renderToStaticMarkup(<StudentHomePage />);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h2 id="modulos-programa-titulo"/);
    expect(html).not.toContain('<main');
  });
});
