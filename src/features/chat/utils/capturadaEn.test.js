import { expect, it } from 'vitest';

import { capturadaEn } from './capturadaEn.js';

const INSTANTE = new Date('2026-11-08T19:30:00Z');

it.each([
  [300, '2026-11-08T14:30:00-05:00'],
  [-330, '2026-11-09T01:00:00+05:30'],
  [0, '2026-11-08T19:30:00+00:00'],
])('con desfase %i da %s', (desfase, esperado) => {
  expect(capturadaEn(INSTANTE, desfase)).toBe(esperado);
});

it('con el desfase del dispositivo representa el mismo instante', () => {
  const texto = capturadaEn(INSTANTE);

  expect(texto).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  expect(Date.parse(texto)).toBe(INSTANTE.getTime());
});
