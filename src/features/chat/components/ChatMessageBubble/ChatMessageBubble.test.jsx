import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ChatMessageBubble } from './ChatMessageBubble.jsx';

it('el mensaje es de Brisa y el texto va tal cual', () => {
  const html = renderToStaticMarkup(<ChatMessageBubble texto={'Hola\n  tú'} />);

  expect(html).toContain('Brisa: </span>Hola\n  tú');
  expect(html).not.toContain('Sistema: ');
});
