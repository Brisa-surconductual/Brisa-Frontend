import { describe, expect, it } from 'vitest';

import {
  TRACKING_DEMO_SCENARIO,
  getTrackingDemoScenario,
} from '../utils/trackingDemoScenario.js';
import { DEMO_TRACKING_INDICATORS } from './trackingDemoData.js';

describe('Indicadores ficticios de seguimiento', () => {
  it('solo tienen progreso, adherencia y alertas activas, con valores válidos o no disponibles', () => {
    for (const indicators of Object.values(DEMO_TRACKING_INDICATORS)) {
      expect(Object.keys(indicators).sort()).toEqual(['activeAlertCount', 'adherence', 'progress']);
      for (const value of [indicators.progress, indicators.adherence]) {
        expect(value === null || (value >= 0 && value <= 100)).toBe(true);
      }
      expect(indicators.activeAlertCount === null || Number.isInteger(indicators.activeAlertCount)).toBe(true);
    }
  });

  it('no contienen datos personales, clínicos, textos ni estados de elegibilidad', () => {
    expect(JSON.stringify(DEMO_TRACKING_INDICATORS)).not.toMatch(/@|correo|nombre|documento|diario|chat|ACTIVO|PENDIENTE|INACTIVO/i);
  });

  it('son inmutables', () => {
    expect(Object.isFrozen(DEMO_TRACKING_INDICATORS)).toBe(true);
    for (const indicators of Object.values(DEMO_TRACKING_INDICATORS)) expect(Object.isFrozen(indicators)).toBe(true);
  });
});

describe('Escenarios de seguimiento (propios)', () => {
  it('lee su propia variable; un valor desconocido muestra la lista', () => {
    expect(getTrackingDemoScenario({ VITE_M08_TRACKING_SCENARIO: 'denegado' })).toBe(TRACKING_DEMO_SCENARIO.DENIED);
    expect(getTrackingDemoScenario({ VITE_M08_TRACKING_SCENARIO: 'otro' })).toBe(TRACKING_DEMO_SCENARIO.LIST);
    expect(getTrackingDemoScenario({ VITE_M08_DEMO_SCENARIO: 'error', VITE_M08_AUDIT_SCENARIO: 'error' })).toBe(TRACKING_DEMO_SCENARIO.LIST);
  });
});
