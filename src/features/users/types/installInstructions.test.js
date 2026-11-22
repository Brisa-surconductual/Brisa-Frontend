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

it('Computador cubre Chrome, Edge, Opera, Safari y Firefox', () => {
  expect(INSTALL_INSTRUCTIONS.desktop.groups.map((g) => g.title)).toEqual([
    'En Chrome',
    'En Edge',
    'En Opera',
    'En Safari (Mac)',
    'En Firefox (Windows)',
  ]);
});

// Con manifest (ADR-0006) se instala; ya no se recomienda el acceso directo.
it('Android recomienda «Instalar», no «Crear acceso directo»', () => {
  const text = INSTALL_INSTRUCTIONS.android.steps
    .flat()
    .map((fragment) => fragment.negrita ?? fragment)
    .join(' ');

  expect(text).toContain('«Instalar»');
  expect(text).not.toContain('«Crear acceso directo»');
});
