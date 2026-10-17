import { expect, it } from 'vitest';

import {
  INSTALL_INSTRUCTIONS,
  INSTALL_KEY,
  INSTALL_PLATFORM,
} from './installInstructions.js';

const allSteps = Object.values(INSTALL_INSTRUCTIONS).flatMap((entry) => [
  ...(entry.steps ?? []),
  ...(entry.groups ?? []).flatMap((group) => group.steps),
]);

it('tiene instrucciones para las cuatro plataformas', () => {
  expect(Object.keys(INSTALL_INSTRUCTIONS).sort()).toEqual(
    Object.values(INSTALL_PLATFORM).sort(),
  );
});

it('está congelado en profundidad', () => {
  expect(Object.isFrozen(INSTALL_INSTRUCTIONS.desktop.groups[0].steps[1]))
    .toBe(true);
});

it('no contiene HTML y solo usa teclas conocidas', () => {
  const keys = Object.values(INSTALL_KEY);

  allSteps.flat().forEach((fragment) => {
    if (typeof fragment === 'string') {
      expect(fragment).not.toContain('<');
    } else if ('tecla' in fragment) {
      expect(keys).toContain(fragment.tecla);
    } else {
      expect(fragment.negrita).not.toContain('<');
    }
  });
});

it('Computador tiene los grupos de Chrome, Edge y Firefox', () => {
  expect(INSTALL_INSTRUCTIONS.desktop.groups.map((g) => g.title)).toEqual([
    'En Chrome',
    'En Edge',
    'En Firefox (Windows)',
  ]);
});
