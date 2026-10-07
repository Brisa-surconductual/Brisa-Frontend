import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { EMISOR } from '../../types/index.js';
import { ChatMessageBubble } from './ChatMessageBubble.jsx';

it('AVATAR y SISTEMA producen marcados distintos', () => {
  const avatar = renderToStaticMarkup(
    <ChatMessageBubble emisor={EMISOR.AVATAR} texto="Hola" />,
  );
  const sistema = renderToStaticMarkup(
    <ChatMessageBubble emisor={EMISOR.SISTEMA} texto="Hola" />,
  );

  expect(sistema).toContain('border-dashed');
  expect(avatar).not.toContain('border-dashed');
  expect(sistema).toContain('Sistema: ');
  expect(avatar).toContain('Brisa: ');
});
