import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { REGISTRATION_STATUS_VIEW } from '@/features/users/services/registrationState.js';

import { ModuleGrid } from './components/ModuleGrid.jsx';
import { RegistrationStatusNotice } from './components/RegistrationStatusNotice.jsx';
import { useStudentHomePage } from './hooks/useStudentHomePage.js';
import { StudentHomePage } from './StudentHomePage.jsx';
import { STUDENT_TOOL_MODULES } from './data/studentModules.js';

const auth = vi.hoisted(() => ({ value: {} }));

vi.mock('@/app/providers/index.js', () => ({ useAuth: () => auth.value }));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/features/cronograma/components/CurrentContentAccessCard/index.js', () => ({
  CurrentContentAccessCard: () => <section>tarjeta-contenido-actual</section>,
}));

vi.mock('@/features/cronograma/components/AssignedScheduleSummary/index.js', () => ({
  AssignedScheduleSummary: () => <div>resumen-cronograma</div>,
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
    const html = renderToStaticMarkup(
    <MemoryRouter>
      <StudentHomePage />
    </MemoryRouter>,
  );

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
    const html = renderToStaticMarkup(
    <MemoryRouter>
      <StudentHomePage />
    </MemoryRouter>,
  );

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

describe('Otras herramientas para ti (CP-12)', () => {
  const renderGrid = () =>
    renderToStaticMarkup(
      <MemoryRouter>
        <ModuleGrid />
      </MemoryRouter>,
    );

  it('conserva Diario, Progreso y Mascota con orden, descripciones y versión', () => {
    const html = renderGrid();
    const positions = STUDENT_TOOL_MODULES.map(({ name }) => html.indexOf(`${name}</h3>`));

    expect(STUDENT_TOOL_MODULES.map(({ name }) => name)).toEqual(['Diario', 'Progreso', 'Mascota']);
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    for (const { description, release } of STUDENT_TOOL_MODULES) {
      expect(html).toContain(description);
      // `release` es interno: el código académico no se muestra.
      expect(html).not.toContain(release);
    }
  });

  it('el chat no se repite en la cuadrícula', () => {
    const html = renderGrid();

    expect(html).not.toContain('Chat</h3>');
    expect(html).not.toContain('href="/app/estudiante/chat"');
  });

  it('las herramientas sin pantalla siguen como «Disponible próximamente», sin enlaces ni botones', () => {
    const html = renderGrid();

    expect(html).not.toContain('<a ');
    expect(html.match(/Disponible próximamente/g)).toHaveLength(3);
    expect(html).not.toContain('<button');
  });

  it('una herramienta con pantalla real se muestra como enlace', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ModuleGrid
          modules={[{ id: 'DIARIO', name: 'Diario', description: 'd', release: 'M02', to: '/x' }]}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/x"');
    expect(html).not.toContain('próximamente');
  });
});

describe('Estructura del inicio (CP-20)', () => {
  it('un solo h1, secciones bajo h2 en el orden acordado y sin <main> propio', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <StudentHomePage />
      </MemoryRouter>,
    );
    const order = [
      'Hola, ana.qa</h1>',
      'id="espacio-terapeutico-titulo"',
      'id="estado-programa-titulo"',
      'tarjeta-contenido-actual',
      'id="otras-herramientas-titulo"',
    ].map((marker) => html.indexOf(marker));

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(order.every((position) => position >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).not.toContain('<main');
  });
});
