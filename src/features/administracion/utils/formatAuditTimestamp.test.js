import { describe, expect, it } from 'vitest';

import { AUDIT_TIME_ZONE, formatAuditTimestamp } from './formatAuditTimestamp.js';

describe('formatAuditTimestamp (RF-123, marca_temporal)', () => {
  it('muestra la hora de Colombia', () => {
    expect(AUDIT_TIME_ZONE).toBe('America/Bogota');
    expect(formatAuditTimestamp('2026-03-09T14:32:05Z')).toBe('9 de mar de 2026, 09:32');
  });

  it('el mismo instante con otra zona explícita da la misma hora local', () => {
    expect(formatAuditTimestamp('2026-03-09T09:32:05-05:00')).toBe(formatAuditTimestamp('2026-03-09T14:32:05Z'));
    expect(formatAuditTimestamp('2026-03-09T16:32:05+02:00')).toBe('9 de mar de 2026, 09:32');
  });

  it('cambia de día cuando corresponde en la hora de Colombia', () => {
    expect(formatAuditTimestamp('2026-03-07T02:00:00Z')).toBe('6 de mar de 2026, 21:00');
  });

  it('acepta milisegundos y minutos sin segundos', () => {
    expect(formatAuditTimestamp('2026-03-07T12:00:00.000Z')).toBe('7 de mar de 2026, 07:00');
    expect(formatAuditTimestamp('2026-03-07T12:00Z')).toBe('7 de mar de 2026, 07:00');
  });

  it.each([
    ['sin zona horaria', '2026-03-05T08:00:00'],
    ['solo fecha', '2026-03-05'],
    ['texto', 'ayer'],
    ['fecha imposible', '2026-13-45T25:00:00Z'],
    ['vacío', ''],
    ['no texto', 1741530000000],
    ['ausente', undefined],
  ])('%s: no se interpreta', (_, value) => expect(formatAuditTimestamp(value)).toBeNull());
});
