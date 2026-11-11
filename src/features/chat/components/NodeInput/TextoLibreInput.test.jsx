import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { TextoLibreInput } from './TextoLibreInput.jsx';

it('asocia el contador al campo, sin región viva ni límite nativo', () => {
  const html = renderToStaticMarkup(
    <TextoLibreInput
      entrada={{ maxCaracteres: 500 }}
      valor={null}
      onCambiar={() => {}}
    />,
  );

  expect(html).toContain('0 de 500 caracteres');
  const [, idContador] = html.match(/<p id="([^"]+)"/);
  expect(html).toContain(`aria-describedby="${idContador}"`);
  expect(html).not.toContain('aria-live');
  expect(html).not.toContain('maxlength');
  expect(html).not.toContain('placeholder');
});
