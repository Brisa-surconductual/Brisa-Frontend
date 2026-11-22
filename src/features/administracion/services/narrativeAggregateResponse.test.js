import { describe, expect, it } from 'vitest';

import {
  DEMO_NARRATIVE_DATA,
  DEMO_NARRATIVE_FORBIDDEN_FIELDS,
} from '../data/narrativeAggregateDemoData.js';
import { AGGREGATE_VIEW_STATUS as S } from '../types/behavioralAggregate.js';
import {
  aggregateStatusFromError,
  interpretNarrativeAggregate,
} from './narrativeAggregateResponse.js';

const COHORT = 'demo-cohorte-b';

// Respuesta del contrato de referencia de RF-133 (sin total_usuarios_cohorte
// ni fecha_actualizacion, como en ese contrato).
const response = (changes = {}) => ({
  id_cohorte: COHORT,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: '2026-11-15T05:00:00Z',
  motivo_sin_datos: null,
  mensaje: null,
  datos: {
    distribucion_por_fase_narrativa: [
      { fase: 'INICIO', total: 12 },
      { fase: 'DESARROLLO', total: 24 },
      { fase: 'CIERRE', total: 6 },
    ],
    total_usuarios_programa_completado: 3,
    total_usuarios_con_logros: 31,
    total_logros_desbloqueados: 87,
  },
  ...changes,
});

const interpret = (changes) =>
  interpretNarrativeAggregate(response(changes), COHORT);

const withData = (datos) =>
  interpret({ datos: { ...response().datos, ...datos } });

describe('Vista narrativa agregada (RF-133): datos disponibles', () => {
  it('presenta las tres fases, graduación y logros tal como llegan', () => {
    const view = interpret();

    expect(view.status).toBe(S.READY);
    expect(view.data).toEqual({
      phaseDistribution: [
        { phase: 'INICIO', users: 12 },
        { phase: 'DESARROLLO', users: 24 },
        { phase: 'CIERRE', users: 6 },
      ],
      cohortUsers: null,
      completedProgramUsers: 3,
      usersWithAchievements: 31,
      unlockedAchievements: 87,
      updatedAt: null,
    });
    expect(view.lastAvailableAt).toBe('2026-11-15T05:00:00Z');
    expect(view.aggregationState).toBe('ACTUALIZADO');
  });

  it('ordena las fases INICIO, DESARROLLO, CIERRE aunque lleguen en otro orden', () => {
    const view = withData({
      distribucion_por_fase_narrativa: [
        { fase: 'CIERRE', total: 1 },
        { fase: 'INICIO', total: 2 },
        { fase: 'DESARROLLO', total: 3 },
      ],
    });

    expect(view.data.phaseDistribution.map(({ phase }) => phase)).toEqual([
      'INICIO',
      'DESARROLLO',
      'CIERRE',
    ]);
  });

  it('no recalcula: no suma fases, no las compara con el total ni redondea', () => {
    const view = withData({
      distribucion_por_fase_narrativa: [
        { fase: 'INICIO', total: 1 },
        { fase: 'DESARROLLO', total: 1 },
        { fase: 'CIERRE', total: 1 },
      ],
      total_usuarios_cohorte: 40,
      total_usuarios_con_logros: 2,
      total_logros_desbloqueados: 500,
    });

    expect(view.data.cohortUsers).toBe(40);
    expect(view.data.usersWithAchievements).toBe(2);
    expect(view.data.unlockedAchievements).toBe(500);
    expect(Object.keys(view.data)).not.toContain('total');
  });

  it('un cero real se conserva y un dato ausente o inválido es null, nunca 0', () => {
    const view = withData({
      total_usuarios_programa_completado: 0,
      total_usuarios_con_logros: undefined,
      total_logros_desbloqueados: '87',
    });

    expect(view.data.completedProgramUsers).toBe(0);
    expect(view.data.usersWithAchievements).toBeNull();
    expect(view.data.unlockedAchievements).toBeNull();
  });

  it('una fase ausente queda «no disponible»; una fase desconocida se ignora', () => {
    const view = withData({
      distribucion_por_fase_narrativa: [
        { fase: 'INICIO', total: 5 },
        { fase: 'SIN_AVANCE', total: 9 },
        { fase: 'CIERRE', total: -1 },
      ],
    });

    expect(view.data.phaseDistribution).toEqual([
      { phase: 'INICIO', users: 5 },
      { phase: 'DESARROLLO', users: null },
      { phase: 'CIERRE', users: null },
    ]);
  });

  it('sin ninguna fase reconocible, la distribución no se muestra', () => {
    expect(
      withData({ distribucion_por_fase_narrativa: [] }).data.phaseDistribution,
    ).toBeNull();
    expect(
      withData({ distribucion_por_fase_narrativa: 'INICIO' }).data
        .phaseDistribution,
    ).toBeNull();
  });

  it('conserva total_usuarios_cohorte y fecha_actualizacion de RF-117 si llegan', () => {
    const view = withData({
      total_usuarios_cohorte: 45,
      fecha_actualizacion: '2026-11-16T10:00:00Z',
    });

    expect(view.data.cohortUsers).toBe(45);
    expect(view.data.updatedAt).toBe('2026-11-16T10:00:00Z');
  });

  it('usuarios sin perfil narrativo: el aviso de M06 acompaña a los datos sin bloquearlos', () => {
    const view = interpret({ mensaje: 'Algunos usuarios no se incluyen.' });

    expect(view.status).toBe(S.READY);
    expect(view.message).toBe('Algunos usuarios no se incluyen.');
    expect(view.data.completedProgramUsers).toBe(3);
  });
});

describe('Vista narrativa agregada (RF-133): estados sin datos', () => {
  it('sin consolidar es un estado funcional, no un error', () => {
    const view = interpret({
      estado_agregacion: 'PENDIENTE',
      motivo_sin_datos: 'SIN_CONSOLIDAR',
      datos: null,
      mensaje: 'Sin progresión consolidada.',
    });

    expect(view).toMatchObject({
      status: S.NOT_CONSOLIDATED,
      data: null,
      message: 'Sin progresión consolidada.',
    });
  });

  it('desactualizada: conserva la última vista válida con su fecha', () => {
    const view = interpret({
      estado: 'DESACTUALIZADA',
      estado_agregacion: 'ERROR_ACTUALIZACION',
    });

    expect(view.status).toBe(S.STALE);
    expect(view.data.unlockedAchievements).toBe(87);
    expect(view.lastAvailableAt).toBe('2026-11-15T05:00:00Z');
  });

  it('M06 no disponible sin última vista: ningún dato', () => {
    expect(
      interpret({
        estado: 'NO_DISPONIBLE',
        datos: null,
        ultimo_timestamp_disponible: null,
      }),
    ).toMatchObject({ status: S.UNAVAILABLE, data: null });
  });

  it('respuestas contradictorias o desconocidas no muestran datos', () => {
    expect(interpret({ estado: 'NO_DISPONIBLE' })).toMatchObject({
      status: S.ERROR,
      data: null,
    });
    expect(interpret({ datos: null })).toMatchObject({ status: S.ERROR });
    expect(interpret({ estado: 'OTRO' })).toMatchObject({ status: S.ERROR });
    expect(interpretNarrativeAggregate(null, COHORT).status).toBe(S.ERROR);
  });

  it('un agregado suprimido por la fuente nunca muestra datos', () => {
    expect(
      interpret({
        estado: 'NO_DISPONIBLE',
        motivo_sin_datos: 'AGREGADO_SUPRIMIDO',
      }),
    ).toMatchObject({ status: S.SUPPRESSED, data: null });
  });

  it('rechazos: cohorte inexistente por código y fallo genérico', () => {
    expect(aggregateStatusFromError({ code: 'COHORT_NOT_FOUND' })).toBe(
      S.NOT_FOUND,
    );
    expect(aggregateStatusFromError(new Error('COHORT_NOT_FOUND'))).toBe(
      S.ERROR,
    );
  });
});

describe('Vista narrativa agregada (RF-133): aislamiento y privacidad', () => {
  it('la respuesta de otra cohorte no deja ningún dato', () => {
    expect(
      interpretNarrativeAggregate(response(), 'demo-cohorte-c'),
    ).toMatchObject({ status: S.INCONSISTENT, data: null });
    expect(interpret({ id_cohorte: '' }).status).toBe(S.INCONSISTENT);
  });

  it('descarta perfiles, capítulos, logros específicos e identificadores', () => {
    const view = interpretNarrativeAggregate(
      {
        ...response({
          datos: {
            ...DEMO_NARRATIVE_DATA[COHORT],
            ...DEMO_NARRATIVE_FORBIDDEN_FIELDS,
            capitulo_activo: 'Capítulo 3',
            logros_especificos: ['Logro X'],
          },
        }),
        ...DEMO_NARRATIVE_FORBIDDEN_FIELDS,
      },
      COHORT,
    );
    const json = JSON.stringify(view);

    expect(Object.keys(view.data).sort()).toEqual([
      'cohortUsers',
      'completedProgramUsers',
      'phaseDistribution',
      'unlockedAchievements',
      'updatedAt',
      'usersWithAchievements',
    ]);
    expect(json).not.toMatch(
      /PART-|example\.com|0000000000bb|ficticio|Capítulo|Logro|perfiles/,
    );
  });
});
