import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  FACULTY_DISTRIBUTION,
  POPULATION_AVERAGES,
} from '../data/psychologyStats.js';
import { usePsychologyHomePage } from '../hooks/usePsychologyHomePage.js';
import { PopulationPanel } from './PopulationPanel.jsx';
import { SettingsPanel } from './SettingsPanel.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  endSession: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams('tab=AJUSTES'), vi.fn()],
}));

vi.mock('@/app/providers/index.js', () => ({
  useAuth: () => ({
    user: { email: 'admin.prueba@example.com' },
    role: 'ADMINISTRATIVO',
    endSession: mocks.endSession,
    logout: mocks.logout,
  }),
}));

const clean = (html) => html.replaceAll('<!-- -->', '');

function findAll(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, predicate, found));
    return found;
  }
  if (predicate(node)) found.push(node);
  findAll(node.props?.children, predicate, found);
  return found;
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

describe('Población rediseñada', () => {
  const html = clean(renderToStaticMarkup(<PopulationPanel />));

  it('identifica las cifras como demostrativas en el aviso y en cada bloque', () => {
    expect(html).toContain('Datos demostrativos');
    expect(html).toContain('No provienen del backend ni describen a la población');
    expect(html.match(/>Ejemplo</g)).toHaveLength(2);
  });

  it('conserva el aviso de información agregada y anónima', () => {
    expect(html).toContain('Vista agregada y anónima');
    expect(html).toContain('El acceso a datos individuales identificables requiere');
  });

  it('no cambia los valores de ejemplo ni agrega métricas', () => {
    for (const { label, count } of FACULTY_DISTRIBUTION) {
      expect(html).toMatch(new RegExp(`${label}</span><span[^>]*>${count}<span`));
    }
    for (const { label, value } of POPULATION_AVERAGES) {
      expect(html).toMatch(new RegExp(`${label}</dt><dd[^>]*>${value}</dd>`));
    }
    expect(html.match(/<dt/g)).toHaveLength(POPULATION_AVERAGES.length);
    expect(html.match(/<li/g)).toHaveLength(FACULTY_DISTRIBUTION.length);
  });

  it('usa h2 bajo el h1 de la página y no repite landmarks', () => {
    expect(html).not.toContain('<h1');
    expect(html).not.toContain('<h3');
    expect(html.match(/<h2/g)).toHaveLength(2);
    expect(html).not.toContain('<main');
  });
});

describe('Ajustes rediseñados', () => {
  const props = {
    email: 'admin.prueba@example.com',
    roleLabel: 'Administrativo',
    onLogout: vi.fn(),
  };

  it('presenta correo y rol sin crear controles de configuración', () => {
    const html = clean(renderToStaticMarkup(<SettingsPanel {...props} />));

    expect(html).toMatch(/Correo<\/dt><dd[^>]*>admin\.prueba@example\.com<\/dd>/);
    expect(html).toContain('Administrativo');
    expect(html).not.toMatch(/<input|<select|<textarea|<form/);
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it('declara las capacidades pendientes como no disponibles', () => {
    const html = clean(renderToStaticMarkup(<SettingsPanel {...props} />));

    expect(html).toContain('Aún no disponible');
    expect(html).toContain('Ajustes del programa');
    expect(html).toContain('Llega en M04');
    expect(html).toContain('Gestión de reportes');
    expect(html).toContain('Llega en M08');
  });

  it('sin correo muestra ausencia, no un valor inventado', () => {
    const html = clean(renderToStaticMarkup(<SettingsPanel {...props} email="" />));

    expect(html).toMatch(/Correo<\/dt><dd[^>]*>—<\/dd>/);
  });

  it('el botón de cierre usa el manejador recibido', () => {
    const [button] = findAll(SettingsPanel(props), (el) => el.props?.onClick);

    expect(button.props.onClick).toBe(props.onLogout);
  });

  it('el manejador del panel cierra la sesión en el backend, no solo localmente', async () => {
    mocks.endSession.mockResolvedValue(undefined);
    const { handleLogout } = usePsychologyHomePage();

    await handleLogout();

    expect(mocks.endSession).toHaveBeenCalledTimes(1);
    expect(mocks.logout).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
