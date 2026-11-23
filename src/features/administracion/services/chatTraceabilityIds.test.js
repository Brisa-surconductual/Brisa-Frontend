import { describe, expect, it } from 'vitest';

import { isUuid, normalizeParticipantCode, normalizeSessionId } from './chatTraceabilityIds.js';

describe('normalizeParticipantCode (A7)', () => {
  it.each([
    ['P-1A2B3C4D', 'P-1A2B3C4D'],
    ['p-1a2b3c4d', 'P-1A2B3C4D'],
    ['  P-00FFAA11 ', 'P-00FFAA11'],
  ])('%s → %s', (value, expected) => expect(normalizeParticipantCode(value)).toBe(expected));

  it.each([
    '00000000-0000-4000-8000-000000000002',
    'seg-0001',
    'PART-0015',
    'P-1A2B3C4Z',
    'P-1A2B',
    'P-1A2B3C4D5',
    'estudiante@example.com',
    '',
    null,
    undefined,
    42,
  ])('rechaza %s', (value) => expect(normalizeParticipantCode(value)).toBeNull());
});

describe('normalizeSessionId', () => {
  it('acepta un UUID y lo devuelve en minúscula', () => {
    expect(normalizeSessionId('00000000-0000-4000-8000-00000000000A')).toBe(
      '00000000-0000-4000-8000-00000000000a',
    );
  });

  it.each(['no-es-uuid', '../trazabilidad', '', null, 'P-1A2B3C4D'])('rechaza %s', (value) =>
    expect(normalizeSessionId(value)).toBeNull());

  it('isUuid', () => {
    expect(isUuid('00000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isUuid('x')).toBe(false);
  });
});
