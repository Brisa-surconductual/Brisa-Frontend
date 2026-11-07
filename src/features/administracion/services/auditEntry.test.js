import { describe, expect, it } from 'vitest';

import { AUDIT_ACTION } from '../types/auditAction.js';
import { AUDIT_STATUS } from '../types/auditStatus.js';
import { toAuditEntries, toAuditEntry } from './auditEntry.js';

const RECORD = Object.freeze({
  id: 'a-1',
  action: AUDIT_ACTION.DATA_EXPORT,
  resource: 'Recurso de prueba',
  timestamp: '2026-01-01T10:00:00Z',
  status: AUDIT_STATUS.SUCCESS,
  ipAddress: '192.0.2.1',
  userId: 'u-interno',
  sessionId: 's-interna',
  resourceId: 'r-interno',
  userEmail: 'persona@example.com',
  participantName: 'Nombre Apellido',
  document: '123456789',
  consumptionData: 'consumo',
  clinicalProfile: 'clínico',
  requestBody: '{"x":1}',
  userAgent: 'Agente/1.0',
});

describe('Lista explícita de campos de auditoría', () => {
  it('conserva solo id, acción, recurso, marca temporal y estado', () => {
    const entry = toAuditEntry(RECORD);

    expect(entry).toEqual({
      id: 'a-1',
      action: AUDIT_ACTION.DATA_EXPORT,
      resource: 'Recurso de prueba',
      timestamp: '2026-01-01T10:00:00Z',
      status: AUDIT_STATUS.SUCCESS,
    });
    expect(Object.isFrozen(entry)).toBe(true);
    expect(JSON.stringify(entry)).not.toMatch(/192\.0\.2|interno|interna|@|Nombre|123456789|consumo|clínico|Agente/);
  });

  it('un valor que no es texto se descarta, sin inventar contenido', () => {
    expect(toAuditEntry({ id: 7, action: { x: 1 }, resource: null, timestamp: 0, status: ['EXITOSA'] })).toEqual({
      id: '',
      action: '',
      resource: '',
      timestamp: '',
      status: '',
    });
    expect(toAuditEntry(null).action).toBe('');
  });

  it('respeta el orden recibido y no filtra registros', () => {
    const records = [{ ...RECORD, id: 'c' }, { ...RECORD, id: 'a' }, { ...RECORD, id: 'b' }];

    expect(toAuditEntries(records).map(({ id }) => id)).toEqual(['c', 'a', 'b']);
  });

  it('una respuesta que no es lista se trata como vacía', () => {
    expect(toAuditEntries(null)).toEqual([]);
    expect(toAuditEntries({ registros: [] })).toEqual([]);
  });
});
