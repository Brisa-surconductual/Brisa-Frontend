import { expect, it } from 'vitest';

import { isNodoPresentable } from './isNodoPresentable.js';

it('solo es presentable un nodo con texto no vacío', () => {
  expect(isNodoPresentable(undefined)).toBe(false);
  expect(isNodoPresentable({})).toBe(false);
  expect(isNodoPresentable({ contenido: {} })).toBe(false);
  expect(isNodoPresentable({ contenido: { texto: '' } })).toBe(false);
  expect(isNodoPresentable({ contenido: { texto: '  \n ' } })).toBe(false);
  expect(isNodoPresentable({ contenido: { texto: 'Hola' } })).toBe(true);
});
