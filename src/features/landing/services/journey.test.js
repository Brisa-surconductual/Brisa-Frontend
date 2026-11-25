import { describe, expect, it } from 'vitest';

import { getJourneyWeeks, getStageIndex } from './journey.js';

describe('getJourneyWeeks', () => {
  it('sin total definido usa la vista previa y marca «hay más»', () => {
    expect(getJourneyWeeks(null, 4)).toEqual({
      weeks: [1, 2, 3, 4],
      hasMore: true,
    });
  });

  it('con total definido lo respeta', () => {
    expect(getJourneyWeeks(6, 4)).toEqual({
      weeks: [1, 2, 3, 4, 5, 6],
      hasMore: false,
    });
  });
});

describe('getStageIndex', () => {
  it('inicio, desarrollo y cierre', () => {
    expect(getStageIndex(0, 6, false)).toBe(0);
    expect(getStageIndex(2, 6, false)).toBe(1);
    expect(getStageIndex(5, 6, false)).toBe(2);
  });

  it('sin total conocido nunca muestra el cierre', () => {
    expect(getStageIndex(3, 4, true)).toBe(1);
  });
});
