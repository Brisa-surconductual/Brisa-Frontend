import { describe, expect, it } from 'vitest';

import { PROGRESS_LEVEL } from '../types/behavioralAggregate.js';
import {
  BASELINE_STATUS,
  CONSENT_STATUS,
  PARTICIPATION_STATUS,
  REGISTRATION_STATUS,
} from '../types/participantStatus.js';
import { DEMO_AGGREGATE_DATA } from './behavioralAggregateDemoData.js';
import { DEMO_EVOLUTION_SERIES } from './cohortEvolutionDemoData.js';
import { DEMO_NARRATIVE_DATA } from './narrativeAggregateDemoData.js';
import { DEMO_NOTIFICATION_DATA } from './notificationAggregateDemoData.js';
import { DEMO_PARTICIPANT_CATALOG } from './participantCatalogDemoData.js';
import { DEMO_PARTICIPANTS } from './participantDemoData.js';
import {
  DEMO_ALERT_HISTORY,
  DEMO_TRACKING_PROFILES,
  DEMO_TRACKING_REFERENCES,
} from './trackingDemoData.js';

/*
 * Coherencia entre los fixtures compartidos de la demostración M08 para
 * la Cohorte Piloto B: los participantes asignados (RF-125) y los
 * indicadores agregados (RF-132, RF-133, RF-134, RF-141), que también
 * alimentan RF-140 y RF-144. La prueba no calcula ningún indicador de la
 * aplicación: solo compara datos ficticios fijos entre sí para que no
 * vuelvan a contradecirse.
 *
 * La Cohorte Piloto C (INACTIVA) conserva a propósito sus fixtures
 * originales (2 participantes inactivos frente a 11 activos agregados);
 * su alineación queda pendiente fuera de este ajuste.
 */
const B = 'demo-cohorte-b';
const pilotB = DEMO_PARTICIPANTS.filter(({ cohortId }) => cohortId === B);
const byStatus = (status) =>
  pilotB.filter(({ participationStatus }) => participationStatus === status);
const activeB = byStatus(PARTICIPATION_STATUS.ACTIVE);
const aggregateB = DEMO_AGGREGATE_DATA[B];

describe('Cohorte Piloto B: participantes (RF-125) frente a la vista agregada (RF-132)', () => {
  it('22 asignados: 18 activos, 3 pendientes de validación y 1 inactivo', () => {
    expect(pilotB).toHaveLength(22);
    expect(activeB).toHaveLength(18);
    expect(byStatus(PARTICIPATION_STATUS.PENDING_VALIDATION)).toHaveLength(3);
    expect(byStatus(PARTICIPATION_STATUS.INACTIVE)).toHaveLength(1);
  });

  it('los activos asignados son los usuarios activos de la vista agregada', () => {
    expect(activeB).toHaveLength(aggregateB.total_usuarios_activos);
  });

  it('todo activo tiene registro completo, consentimiento aceptado y línea base registrada', () => {
    for (const participant of activeB) {
      expect(participant).toMatchObject({
        registrationStatus: REGISTRATION_STATUS.COMPLETE,
        consentStatus: CONSENT_STATUS.ACCEPTED,
        baselineStatus: BASELINE_STATUS.REGISTERED,
        pendingReasons: [],
      });
    }
  });

  it('los casos pendientes e inactivo originales se conservan', () => {
    expect(
      byStatus(PARTICIPATION_STATUS.PENDING_VALIDATION).map(({ code }) => code),
    ).toEqual(['PART-0003', 'PART-0004', 'PART-0005']);
    expect(
      byStatus(PARTICIPATION_STATUS.INACTIVE).map(({ code }) => code),
    ).toEqual(['PART-0006']);
  });

  it('identificadores y códigos únicos entre participantes y catálogo', () => {
    const all = [...DEMO_PARTICIPANTS, ...DEMO_PARTICIPANT_CATALOG];

    expect(new Set(all.map(({ id }) => id)).size).toBe(all.length);
    expect(new Set(all.map(({ code }) => code)).size).toBe(all.length);
  });

  it('las demás cohortes no cambian', () => {
    const others = DEMO_PARTICIPANTS.filter(({ cohortId }) => cohortId !== B);

    expect(others.map(({ code, cohortId }) => `${cohortId}:${code}`)).toEqual([
      'demo-cohorte-c:PART-0007',
      'demo-cohorte-c:PART-0008',
    ]);
  });
});

describe('Cohorte Piloto B: indicadores agregados compatibles con su población', () => {
  const sum = (values) => values.reduce((total, value) => total + value, 0);

  it('RF-132: la distribución por nivel cubre a los usuarios activos', () => {
    expect(
      sum(
        aggregateB.distribucion_niveles_progreso.map(
          ({ total_usuarios: t }) => t,
        ),
      ),
    ).toBe(aggregateB.total_usuarios_activos);
  });

  it('RF-133: las fases narrativas suman los usuarios activos y graduación y logros caben en ellas', () => {
    const narrative = DEMO_NARRATIVE_DATA[B];
    const phases = sum(
      narrative.distribucion_por_fase_narrativa.map(({ total }) => total),
    );
    const closing = narrative.distribucion_por_fase_narrativa.find(
      ({ fase }) => fase === 'CIERRE',
    ).total;

    expect(phases).toBe(aggregateB.total_usuarios_activos);
    expect(phases).toBeLessThanOrEqual(pilotB.length);
    expect(narrative.total_usuarios_programa_completado).toBeLessThanOrEqual(
      closing,
    );
    expect(narrative.total_usuarios_con_logros).toBeLessThanOrEqual(phases);
  });

  it('RF-134: entregadas no superan enviadas y las descartadas son entregadas descartadas', () => {
    const n = DEMO_NOTIFICATION_DATA[B];

    expect(n.total_notificaciones_entregadas).toBeLessThanOrEqual(
      n.total_notificaciones_enviadas,
    );
    expect(n.total_notificaciones_descartadas).toBeLessThanOrEqual(
      n.total_notificaciones_entregadas,
    );
  });

  it('RF-141: cada unidad cubre a los activos y la última coincide con la vista agregada', () => {
    const series = DEMO_EVOLUTION_SERIES[B];
    const last = series.serie_nivel_progreso_distribucion.at(-1);

    for (const distribution of series.serie_nivel_progreso_distribucion) {
      expect(sum(Object.values(distribution))).toBe(
        aggregateB.total_usuarios_activos,
      );
    }
    for (const {
      nivel,
      total_usuarios: users,
    } of aggregateB.distribucion_niveles_progreso) {
      expect(last[nivel]).toBe(users);
    }
    expect(Object.keys(last).sort()).toEqual(
      Object.values(PROGRESS_LEVEL).sort(),
    );
    expect(series.serie_adherencia_promedio.at(-1)).toBe(
      aggregateB.tasa_adherencia_promedio,
    );
  });
});

describe('Cohorte Piloto B: seguimiento individual (RF-142, RF-128, RF-129)', () => {
  it('todo activo tiene referencia, perfil e historial de seguimiento', () => {
    for (const { id } of activeB) {
      expect(DEMO_TRACKING_REFERENCES[id]).toMatch(/^seg-[a-z0-9]{6}$/);
      expect(DEMO_TRACKING_PROFILES[id]).toBeDefined();
      expect(DEMO_ALERT_HISTORY[id]).toBeDefined();
    }
  });
});
