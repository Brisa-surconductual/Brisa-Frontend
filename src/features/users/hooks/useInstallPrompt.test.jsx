import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { useInstallPrompt } from './useInstallPrompt.js';

function Probe() {
  const { modo, plataforma } = useInstallPrompt();

  return <p>{`${modo}|${plataforma}`}</p>;
}

// Vitest corre en node: no hay window ni matchMedia.
it('sin window devuelve instrucciones y no lanza errores', () => {
  expect(renderToStaticMarkup(<Probe />)).toBe(
    '<p>instrucciones|desktop</p>',
  );
});
