import { describe, expect, it } from 'vitest';

import { ASSIGNMENT_ERROR } from '../types/participantAssignment.js';
import {
  splitCandidates,
  toggleSelection,
  validateAssignmentSelection,
} from './participantAssignment.js';

describe('Reglas puras de la asignación', () => {
  it('exige al menos un participante seleccionado', () => {
    expect(validateAssignmentSelection([])).toBe(ASSIGNMENT_ERROR.EMPTY_SELECTION);
    expect(validateAssignmentSelection(undefined)).toBe(ASSIGNMENT_ERROR.EMPTY_SELECTION);
    expect(validateAssignmentSelection(['a'])).toBeNull();
  });

  it('separa el catálogo solo según el issue que informó la fuente', () => {
    const candidates = [
      { id: 'a', issue: null },
      { id: 'b', issue: 'YA_ASIGNADO' },
      { id: 'c' },
    ];

    expect(splitCandidates(candidates)).toEqual({
      available: [{ id: 'a', issue: null }, { id: 'c' }],
      unavailable: [{ id: 'b', issue: 'YA_ASIGNADO' }],
    });
    expect(splitCandidates(null)).toEqual({ available: [], unavailable: [] });
  });

  it('alterna la selección sin repetir ni mutar', () => {
    const current = Object.freeze(['a']);

    expect(toggleSelection(current, 'b')).toEqual(['a', 'b']);
    expect(toggleSelection(current, 'a')).toEqual([]);
    expect(current).toEqual(['a']);
  });
});
