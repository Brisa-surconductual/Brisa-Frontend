import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { PsychologyHomePage } from './PsychologyHomePage.jsx';

let activeTabId = 'DASHBOARD';

vi.mock('./hooks/usePsychologyHomePage.js', () => ({
  usePsychologyHomePage: () => ({
    email: 'admin.prueba@example.com',
    roleLabel: 'Administrativo',
    activeTabId,
    handleTabChange: () => {},
    handleLogout: () => {},
  }),
}));

vi.mock('./components/DashboardPanel.jsx', () => ({
  DashboardPanel: () => <p>panel-dashboard</p>,
}));

vi.mock('./components/PopulationPanel.jsx', () => ({
  PopulationPanel: () => <p>panel-poblacion</p>,
}));

vi.mock('./components/SettingsPanel.jsx', () => ({
  SettingsPanel: () => <p>panel-ajustes</p>,
}));

function render(tab) {
  activeTabId = tab;
  return renderToStaticMarkup(<PsychologyHomePage />);
}

describe('Panel administrativo dentro del nuevo layout', () => {
  it.each([
    ['DASHBOARD', 'Dashboard', 'panel-dashboard'],
    ['POBLACION', 'Población', 'panel-poblacion'],
    ['AJUSTES', 'Ajustes', 'panel-ajustes'],
  ])('?tab=%s muestra su título y su panel', (tab, title, panel) => {
    const html = render(tab);

    expect(html).toContain(`>${title}</h1>`);
    expect(html).toContain(panel);
    expect(html.match(/panel-/g)).toHaveLength(1);
  });

  it('no repite encabezado, pestañas ni landmark principal', () => {
    const html = render('DASHBOARD');

    expect(html).not.toContain('role="tab');
    expect(html).not.toContain('<main');
    expect(html).not.toContain('<header class="w-full');
  });
});
