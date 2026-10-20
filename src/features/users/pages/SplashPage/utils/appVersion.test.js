import { expect, it } from 'vitest';

import { formatAppFooter } from './appVersion.js';

it('antepone la versión cuando existe', () => {
  expect(formatAppFooter('1.0.0')).toBe('v1.0.0 · Universidad Surcolombiana');
});

it('sin versión muestra solo la institución, nunca «vundefined»', () => {
  expect(formatAppFooter('')).toBe('Universidad Surcolombiana');
  expect(formatAppFooter(undefined)).toBe('Universidad Surcolombiana');
});
