import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { createInstallPromptStore } from '../utils/installPromptEvent.js';

import { useInstallPrompt } from './useInstallPrompt.js';

function Probe({ store }) {
  const { modo, plataforma } = useInstallPrompt(store);

  return <p>{`${modo}|${plataforma}`}</p>;
}

// Vitest corre en node: no hay window ni matchMedia.
it('sin window devuelve instrucciones y no lanza errores', () => {
  expect(renderToStaticMarkup(<Probe />)).toBe(
    '<p>instrucciones|desktop</p>',
  );
});

it('con el aviso del navegador guardado devuelve nativo', () => {
  const store = createInstallPromptStore();
  const win = new EventTarget();
  const event = new Event('beforeinstallprompt', { cancelable: true });

  store.listen(win);
  win.dispatchEvent(event);

  expect(renderToStaticMarkup(<Probe store={store} />)).toBe(
    '<p>nativo|desktop</p>',
  );
});
