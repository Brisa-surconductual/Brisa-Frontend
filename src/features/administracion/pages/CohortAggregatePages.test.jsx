import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { CohortAggregatePage } from './CohortAggregatePage/CohortAggregatePage.jsx';
import { CohortNarrativePage } from './CohortNarrativePage/CohortNarrativePage.jsx';
import { CohortNotificationsPage } from './CohortNotificationsPage/CohortNotificationsPage.jsx';

const ID = '3f6c2a1e-8b7d-4c53-9a21-5d0e7b9f4a10';
const BASE_PATH = '/app/administrativo/cohortes';

afterEach(() => vi.unstubAllEnvs());

it.each([
  [
    'vista-agregada',
    CohortAggregatePage,
    'Participantes activos',
    'Cargando la vista agregada...',
  ],
  ['vista-narrativa', CohortNarrativePage, 'Logros desbloqueados'],
  ['vista-notificaciones', CohortNotificationsPage, 'Enviadas'],
])(
  '%s inicia la carga de la API sin indicadores de demostración',
  (path, Page, metricLabel, loadingLabel) => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', '');
    const route = BASE_PATH + '/:idCohorte/' + path;
    const url = BASE_PATH + '/' + ID + '/' + path;
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={route} element={<Page />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain('aria-busy="true"');
    if (loadingLabel) expect(html).toContain(loadingLabel);
    for (const label of [
      'Integración pendiente',
      'Datos de demostración',
      metricLabel,
    ]) {
      expect(html).not.toContain(label);
    }
  },
);
