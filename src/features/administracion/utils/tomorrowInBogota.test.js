import { describe, expect, it } from 'vitest';

import { getTomorrowInBogota } from './tomorrowInBogota.js';

describe('getTomorrowInBogota', () => {
  it.each([
    // 19:30 del 25 en Bogotá: en UTC ya es el 26, pero mañana sigue siendo el 26.
    ['2026-11-26T00:30:00Z', '2026-11-26'],
    ['2026-11-25T12:00:00Z', '2026-11-26'],
    ['2026-11-30T15:00:00Z', '2026-12-01'],
    ['2026-12-31T23:00:00Z', '2027-01-01'],
    ['2027-01-01T04:59:00Z', '2027-01-01'],
    ['2028-02-28T12:00:00Z', '2028-02-29'],
  ])('a %s responde %s', (instant, expected) => {
    expect(getTomorrowInBogota(new Date(instant))).toBe(expected);
  });
});
