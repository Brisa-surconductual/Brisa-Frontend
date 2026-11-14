import { describe, expect, it } from 'vitest';

import { NOT_CALCULABLE, TRACKING_ALERT_TYPE, TRACKING_TREND } from '../types/participantTracking.js';
import {
  TRACKING_DEMO_SCENARIO,
  getTrackingDemoScenario,
} from '../utils/trackingDemoScenario.js';
import { PROFILE_DEMO_SCENARIO, getProfileDemoScenario } from '../utils/profileDemoScenario.js';
import { DEMO_PARTICIPANTS } from './participantDemoData.js';
import { DEMO_TRACKING_PROFILES, DEMO_TRACKING_REFERENCES } from './trackingDemoData.js';

const PROFILE_FIELDS = ['activeAlerts', 'adherence', 'progress', 'trend', 'updatedAt'];

describe('Perfiles ficticios de seguimiento (fuente única de listado y ficha)', () => {
  it('solo tienen los campos de RF-128, con valores válidos, no disponibles o no calculables', () => {
    for (const profile of Object.values(DEMO_TRACKING_PROFILES)) {
      expect(Object.keys(profile).sort()).toEqual(PROFILE_FIELDS);
      for (const value of [profile.progress, profile.adherence]) {
        expect(value === null || value === NOT_CALCULABLE || (value >= 0 && value <= 100)).toBe(true);
      }
      expect(Array.isArray(profile.activeAlerts)).toBe(true);
      expect(profile.updatedAt).toMatch(/(Z|[+-]\d{2}:\d{2})$/);
    }
  });

  it('cubren las cuatro tendencias, un valor fuera del enumerado y ambos tipos de alerta', () => {
    const trends = new Set(Object.values(DEMO_TRACKING_PROFILES).map(({ trend }) => trend));
    const alertTypes = new Set(Object.values(DEMO_TRACKING_PROFILES).flatMap(({ activeAlerts }) => activeAlerts.map(({ type }) => type)));

    for (const trend of Object.values(TRACKING_TREND)) expect(trends.has(trend)).toBe(true);
    expect([...trends].filter((trend) => !Object.values(TRACKING_TREND).includes(trend))).toEqual(['ESTABILIZACION']);
    expect([...alertTypes].sort()).toEqual(Object.values(TRACKING_ALERT_TYPE).sort());
    expect(Object.values(DEMO_TRACKING_PROFILES).some(({ adherence }) => adherence === NOT_CALCULABLE)).toBe(true);
  });

  it('incluyen un participante asociado sin perfil (204)', () => {
    expect(DEMO_TRACKING_REFERENCES['demo-participante-5']).toBeDefined();
    expect(DEMO_TRACKING_PROFILES['demo-participante-5']).toBeUndefined();
  });

  it('no contienen datos personales, clínicos, textos ni estados de elegibilidad', () => {
    expect(JSON.stringify(DEMO_TRACKING_PROFILES)).not.toMatch(/@|correo|nombre|documento|diario|chat|craving_?level|ACTIVO|PENDIENTE|INACTIVO"/i);
  });

  it('son inmutables', () => {
    expect(Object.isFrozen(DEMO_TRACKING_PROFILES)).toBe(true);
    expect(Object.isFrozen(DEMO_TRACKING_REFERENCES)).toBe(true);
    for (const profile of Object.values(DEMO_TRACKING_PROFILES)) {
      expect(Object.isFrozen(profile)).toBe(true);
      expect(Object.isFrozen(profile.activeAlerts)).toBe(true);
    }
  });
});

describe('Referencias opacas ficticias', () => {
  const references = Object.values(DEMO_TRACKING_REFERENCES);

  it('son únicas y sintéticas', () => {
    expect(new Set(references).size).toBe(references.length);
    for (const reference of references) expect(reference).toMatch(/^seg-[a-z0-9]{6}$/);
  });

  it('no se derivan del código, del identificador interno ni de datos personales', () => {
    const codes = DEMO_PARTICIPANTS.map(({ code }) => code.toLowerCase());

    for (const [id, reference] of Object.entries(DEMO_TRACKING_REFERENCES)) {
      expect(reference).not.toContain(id);
      expect(reference).not.toMatch(/part|demo|participante|candidato|@/);
      for (const code of codes) expect(reference).not.toContain(code.replace('part-', ''));
    }
  });
});

describe('Escenarios propios del listado y de la ficha', () => {
  it('el listado lee su propia variable', () => {
    expect(getTrackingDemoScenario({ VITE_M08_TRACKING_SCENARIO: 'denegado' })).toBe(TRACKING_DEMO_SCENARIO.DENIED);
    expect(getTrackingDemoScenario({ VITE_M08_TRACKING_SCENARIO: 'otro' })).toBe(TRACKING_DEMO_SCENARIO.LIST);
    expect(getTrackingDemoScenario({ VITE_M08_DEMO_SCENARIO: 'error', VITE_M08_AUDIT_SCENARIO: 'error' })).toBe(TRACKING_DEMO_SCENARIO.LIST);
  });

  it('la ficha lee la suya, independiente de la del listado', () => {
    expect(getProfileDemoScenario({ VITE_M08_PROFILE_SCENARIO: 'no-disponible' })).toBe(PROFILE_DEMO_SCENARIO.UNAVAILABLE);
    expect(getProfileDemoScenario({ VITE_M08_PROFILE_SCENARIO: 'otro' })).toBe(PROFILE_DEMO_SCENARIO.PROFILE);
    expect(getProfileDemoScenario({ VITE_M08_TRACKING_SCENARIO: 'error' })).toBe(PROFILE_DEMO_SCENARIO.PROFILE);
  });
});
