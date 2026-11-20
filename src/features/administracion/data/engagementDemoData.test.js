import { describe, expect, it } from 'vitest';

import { NOT_CALCULABLE } from '../types/participantTracking.js';
import {
  NARRATIVE_DEMO_SCENARIO,
  NOTIFICATIONS_DEMO_SCENARIO,
  getNarrativeDemoScenario,
  getNotificationsDemoScenario,
} from '../utils/engagementDemoScenario.js';
import { DEMO_NARRATIVE_PROGRESS, DEMO_NOTIFICATION_INTERACTION } from './engagementDemoData.js';
import { DEMO_TRACKING_REFERENCES } from './trackingDemoData.js';

describe('Progresión narrativa ficticia (RF-130)', () => {
  const entries = Object.values(DEMO_NARRATIVE_PROGRESS);

  it('solo tiene los campos que muestra la interfaz, con nombres explícitamente ficticios', () => {
    for (const [id, value] of Object.entries(DEMO_NARRATIVE_PROGRESS)) {
      expect(DEMO_TRACKING_REFERENCES[id]).toBeDefined();
      expect(Object.keys(value).sort()).toEqual(['achievements', 'activePhaseName', 'lastCompletedChapterName']);
      for (const name of [value.activePhaseName, value.lastCompletedChapterName]) {
        if (name !== null) expect(name).toMatch(/fictici/);
      }
    }
  });

  it('cubre logros vacíos y no disponibles, fase y capítulo ausentes, logro sin nombre y un participante sin progresión', () => {
    expect(entries.some(({ achievements }) => Array.isArray(achievements) && achievements.length === 0)).toBe(true);
    expect(entries.some(({ achievements }) => achievements === null)).toBe(true);
    expect(entries.some(({ activePhaseName }) => activePhaseName === null)).toBe(true);
    expect(entries.some(({ lastCompletedChapterName }) => lastCompletedChapterName === null)).toBe(true);
    expect(entries.some(({ achievements }) => achievements?.some(({ name }) => name === null))).toBe(true);
    expect(DEMO_NARRATIVE_PROGRESS['demo-participante-5']).toBeUndefined();
  });

  it('es inmutable', () => {
    expect(Object.isFrozen(DEMO_NARRATIVE_PROGRESS)).toBe(true);
    for (const value of entries) {
      expect(Object.isFrozen(value)).toBe(true);
      if (value.achievements) expect(Object.isFrozen(value.achievements)).toBe(true);
    }
  });
});

describe('Interacción con notificaciones ficticia (RF-131)', () => {
  const entries = Object.values(DEMO_NOTIFICATION_INTERACTION);

  it('solo tiene los totales y tasas de RF-131', () => {
    for (const [id, value] of Object.entries(DEMO_NOTIFICATION_INTERACTION)) {
      expect(DEMO_TRACKING_REFERENCES[id]).toBeDefined();
      expect(Object.keys(value).sort()).toEqual([
        'conversionRate', 'delivered', 'dismissalRate', 'dismissed', 'openRate', 'opened', 'sent', 'sessionsFromNotification',
      ]);
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Object.isFrozen(DEMO_NOTIFICATION_INTERACTION)).toBe(true);
  });

  it('cubre ceros reales, NO_CALCULABLE, ausentes, inválidos y un participante sin historial', () => {
    const values = entries.flatMap(Object.values);

    expect(values).toContain(0);
    expect(values).toContain(NOT_CALCULABLE);
    expect(values).toContain(null);
    expect(values.some((value) => typeof value === 'number' && value < 0)).toBe(true);
    expect(DEMO_NOTIFICATION_INTERACTION['demo-participante-5']).toBeUndefined();
  });
});

describe('Ausencia de datos personales, clínicos y de contenido', () => {
  it('ningún conjunto incluye correos, nombres, documentos, mensajes, eventos ni identificadores', () => {
    const json = JSON.stringify([DEMO_NARRATIVE_PROGRESS, DEMO_NOTIFICATION_INTERACTION]);

    expect(json).not.toMatch(/@|correo|documento|mensaje|message|evento|trigger|uuid|Id"|craving|diario|chat/i);
  });
});

describe('Escenarios propios de cada sección', () => {
  it('la progresión narrativa lee su propia variable', () => {
    expect(getNarrativeDemoScenario({ VITE_M08_NARRATIVE_SCENARIO: 'sin-permiso-explicito' })).toBe(NARRATIVE_DEMO_SCENARIO.PERMISSION_REQUIRED);
    expect(getNarrativeDemoScenario({ VITE_M08_NARRATIVE_SCENARIO: 'no-calculable' })).toBe(NARRATIVE_DEMO_SCENARIO.DATA);
    expect(getNarrativeDemoScenario({ VITE_M08_NOTIFICATIONS_SCENARIO: 'error', VITE_M08_PROFILE_SCENARIO: 'error' })).toBe(NARRATIVE_DEMO_SCENARIO.DATA);
  });

  it('las notificaciones leen la suya', () => {
    expect(getNotificationsDemoScenario({ VITE_M08_NOTIFICATIONS_SCENARIO: 'no-calculable' })).toBe(NOTIFICATIONS_DEMO_SCENARIO.NOT_CALCULABLE);
    expect(getNotificationsDemoScenario({ VITE_M08_NOTIFICATIONS_SCENARIO: 'sin-logros' })).toBe(NOTIFICATIONS_DEMO_SCENARIO.DATA);
    expect(getNotificationsDemoScenario({ VITE_M08_NARRATIVE_SCENARIO: 'error', VITE_M08_ALERT_HISTORY_SCENARIO: 'error' })).toBe(NOTIFICATIONS_DEMO_SCENARIO.DATA);
  });
});
