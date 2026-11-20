import { describe, expect, it } from 'vitest';

import { COHORT_STATUS } from './cohortStatus.js';

describe('Estados de cohorte (RF-124)', () => {
  it('define exactamente BORRADOR, ACTIVA e INACTIVA', () => {
    expect(COHORT_STATUS).toEqual({
      DRAFT: 'BORRADOR',
      ACTIVE: 'ACTIVA',
      INACTIVE: 'INACTIVA',
    });
  });

  it('no puede modificarse', () => {
    expect(Object.isFrozen(COHORT_STATUS)).toBe(true);
    expect(() => {
      'use strict';
      COHORT_STATUS.ACTIVE = 'OTRO';
    }).toThrow(TypeError);
  });
});
