import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { createServiceWorkerUpdateStore } from '../serviceWorkerUpdateStore.js';

import { UpdateAvailableNotice } from './UpdateAvailableNotice.jsx';

function storeWithRefresh() {
  const store = createServiceWorkerUpdateStore();

  store.connect((options) => {
    options.onNeedRefresh();

    return () => {};
  });

  return store;
}

it('no se pinta si no hay versión nueva', () => {
  const store = createServiceWorkerUpdateStore();

  expect(renderToStaticMarkup(<UpdateAvailableNotice store={store} />)).toBe(
    '',
  );
});

it('anuncia la versión nueva con texto, ícono oculto y dos acciones', () => {
  const html = renderToStaticMarkup(
    <UpdateAvailableNotice store={storeWithRefresh()} />,
  );

  expect(html).toContain('role="status"');
  expect(html).toContain('Hay una nueva versión de Brisa.');
  expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  expect(html).toContain('Actualizar');
  expect(html).toContain('Más tarde');
});
