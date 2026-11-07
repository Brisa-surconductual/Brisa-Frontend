import { describe, expect, it } from 'vitest';

import { AUDIT_ACTION } from '../types/auditAction.js';
import { AUDIT_STATUS } from '../types/auditStatus.js';
import {
  AUDIT_DEMO_SCENARIO,
  getAuditDemoScenario,
} from '../utils/auditDemoScenario.js';
import { DEMO_AUDIT_RECORDS } from './auditDemoData.js';

describe('Catálogos de auditoría (RF-123)', () => {
  it('las acciones son exactamente las cuatro de RF-123', () => {
    expect(Object.values(AUDIT_ACTION)).toEqual([
      'ACCESO_MODULO',
      'CONSULTA_PARTICIPANTE',
      'EXPORTACION_DATOS',
      'CONFIGURACION_UMBRALES',
    ]);
    expect(Object.isFrozen(AUDIT_ACTION)).toBe(true);
  });

  it('los estados son EXITOSA, FALLIDA y DENEGADA', () => {
    expect(Object.values(AUDIT_STATUS)).toEqual(['EXITOSA', 'FALLIDA', 'DENEGADA']);
  });
});

describe('Registros ficticios de auditoría', () => {
  it('cubren las cuatro acciones, una no clasificada y los tres estados', () => {
    const actions = new Set(DEMO_AUDIT_RECORDS.map(({ action }) => action));

    for (const action of Object.values(AUDIT_ACTION)) expect(actions.has(action)).toBe(true);
    expect([...actions].filter((action) => !Object.values(AUDIT_ACTION).includes(action))).toEqual(['ACCION_NO_DEFINIDA']);
    expect(new Set(DEMO_AUDIT_RECORDS.map(({ status }) => status))).toEqual(new Set(Object.values(AUDIT_STATUS)));
  });

  it('tienen marcas temporales distintas e identificadores únicos', () => {
    expect(new Set(DEMO_AUDIT_RECORDS.map(({ timestamp }) => timestamp)).size).toBe(DEMO_AUDIT_RECORDS.length);
    expect(new Set(DEMO_AUDIT_RECORDS.map(({ id }) => id)).size).toBe(DEMO_AUDIT_RECORDS.length);
  });

  it('incluyen campos adicionales que la interfaz debe descartar', () => {
    const extra = DEMO_AUDIT_RECORDS.flatMap((record) =>
      Object.keys(record).filter((key) => !['id', 'action', 'resource', 'timestamp', 'status'].includes(key)),
    );

    expect(extra).toEqual(expect.arrayContaining(['ipAddress', 'userId', 'sessionId', 'resourceId', 'userEmail', 'requestBody', 'userAgent']));
  });

  it('solo usan IP de documentación y correos del dominio reservado', () => {
    for (const { ipAddress } of DEMO_AUDIT_RECORDS.filter((record) => record.ipAddress)) {
      expect(ipAddress).toMatch(/^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/);
    }
    for (const email of JSON.stringify(DEMO_AUDIT_RECORDS).match(/[\w.]+@[\w.]+/g)) {
      expect(email).toMatch(/@example\.com$/);
    }
  });

  it('no hacen referencia a las cohortes ni participantes de la demostración (E1–E7)', () => {
    expect(JSON.stringify(DEMO_AUDIT_RECORDS)).not.toMatch(/Cohorte|cohorte|demo-cohorte|PART-|demo-participante|demo-candidato/);
  });

  it('son inmutables', () => {
    expect(Object.isFrozen(DEMO_AUDIT_RECORDS)).toBe(true);
    for (const record of DEMO_AUDIT_RECORDS) expect(Object.isFrozen(record)).toBe(true);
  });
});

describe('Escenarios de auditoría (propios, separados de cohortes)', () => {
  it('lee su propia variable; un valor desconocido muestra la lista', () => {
    expect(getAuditDemoScenario({ VITE_M08_AUDIT_SCENARIO: 'denegada' })).toBe(AUDIT_DEMO_SCENARIO.DENIED);
    expect(getAuditDemoScenario({ VITE_M08_AUDIT_SCENARIO: 'otro' })).toBe(AUDIT_DEMO_SCENARIO.LIST);
    expect(getAuditDemoScenario({ VITE_M08_DEMO_SCENARIO: 'error' })).toBe(AUDIT_DEMO_SCENARIO.LIST);
  });
});
