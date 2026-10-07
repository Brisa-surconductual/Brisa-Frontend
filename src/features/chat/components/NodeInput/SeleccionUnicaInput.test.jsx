import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { SeleccionUnicaInput } from './SeleccionUnicaInput.jsx';

it('la opción elegida lleva un ícono, no solo color', () => {
  const html = renderToStaticMarkup(
    <SeleccionUnicaInput
      entrada={{
        opciones: [
          { valor: 'a', etiqueta: 'Uno' },
          { valor: 'b', etiqueta: 'Dos' },
        ],
      }}
      valor="b"
      onCambiar={() => {}}
    />,
  );

  expect(html.match(/lucide-check/g)).toHaveLength(1);
  expect(html.indexOf('lucide-check')).toBeGreaterThan(html.indexOf('Uno'));
  expect(html).toMatch(/aria-hidden="true"[^>]*>.*<\/svg>Dos/);
});
