import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { FechaHoraInput } from './FechaHoraInput.jsx';

const render = (entrada) =>
  renderToStaticMarkup(
    <FechaHoraInput entrada={entrada} valor={null} onCambiar={() => {}} />,
  );

it.each([
  ['FECHA', 'date'],
  ['HORA', 'time'],
  ['FECHA_HORA', 'datetime-local'],
  [null, 'datetime-local'],
])('formato %s usa el control nativo %s (D3)', (formato, tipo) => {
  expect(render({ formato })).toContain(`type="${tipo}"`);
});

it('pasa min y max al control y asocia la ayuda (D5)', () => {
  const html = render({
    formato: 'FECHA',
    min: '2026-10-01',
    max: '2026-10-31',
  });

  expect(html).toContain('min="2026-10-01"');
  expect(html).toContain('max="2026-10-31"');
  expect(html).toContain('Entre el 1 de octubre de 2026');
  const [, idAyuda] = html.match(/<p id="([^"]+)"/);
  expect(html).toContain(`aria-describedby="${idAyuda}"`);
});
