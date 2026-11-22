import { describe, expect, it } from 'vitest';

import { AGGREGATE_VIEW_STATUS as S } from '../types/behavioralAggregate.js';
import {
  aggregateStatusFromError,
  interpretBehavioralAggregate,
} from './behavioralAggregateResponse.js';

const COHORT = 'cohorte-1';

const DATOS = Object.freeze({
  total_usuarios_activos: 18,
  distribucion_niveles_progreso: [
    { nivel: 'AVANZADO', total_usuarios: 4 },
    { nivel: 'INICIAL', total_usuarios: 3 },
    { nivel: 'COMPLETADO', total_usuarios: 2 },
    { nivel: 'EN_AVANCE', total_usuarios: 9 },
  ],
  tasa_adherencia_promedio: 0.7342,
  alertas_inactividad_pendientes: 2,
  alertas_craving_pendientes: 0,
  fecha_actualizacion: '2026-11-20T13:00:00Z',
});

const respuesta = (cambios = {}) => ({
  id_cohorte: COHORT,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: '2026-11-20T13:00:00Z',
  motivo_sin_datos: null,
  mensaje: null,
  datos: DATOS,
  ...cambios,
});

const interpretar = (cambios) =>
  interpretBehavioralAggregate(respuesta(cambios), COHORT);

describe('Vista agregada conductual (RF-132): interpretación', () => {
  it('datos disponibles: conserva los valores oficiales tal como llegan', () => {
    const vista = interpretar();

    expect(vista.status).toBe(S.READY);
    expect(vista.data).toEqual({
      activeUsers: 18,
      progressDistribution: [
        { level: 'INICIAL', users: 3 },
        { level: 'EN_AVANCE', users: 9 },
        { level: 'AVANZADO', users: 4 },
        { level: 'COMPLETADO', users: 2 },
      ],
      averageAdherence: 0.7342,
      pendingInactivityAlerts: 2,
      pendingCravingAlerts: 0,
      updatedAt: '2026-11-20T13:00:00Z',
    });
  });

  it('no recalcula: no deriva el total de la distribución, no suma alertas ni redondea la adherencia', () => {
    const vista = interpretar({
      datos: {
        ...DATOS,
        total_usuarios_activos: 25,
        tasa_adherencia_promedio: 0.666666,
      },
    });

    // 3 + 9 + 4 + 2 = 18, pero se conserva el total que entrega la fuente.
    expect(vista.data.activeUsers).toBe(25);
    expect(vista.data.averageAdherence).toBe(0.666666);
    expect(vista.data).not.toHaveProperty('totalAlerts');
    expect(
      vista.data.progressDistribution.every((item) => !('percentage' in item)),
    ).toBe(true);
  });

  it('un dato ausente o inválido queda no disponible, nunca cero', () => {
    const vista = interpretar({
      datos: {
        ...DATOS,
        total_usuarios_activos: null,
        tasa_adherencia_promedio: '73%',
        alertas_inactividad_pendientes: -1,
        alertas_craving_pendientes: 1.5,
        fecha_actualizacion: 'ayer',
        distribucion_niveles_progreso: [
          { nivel: 'INICIAL', total_usuarios: 'tres' },
        ],
      },
    });

    expect(vista.data).toEqual({
      activeUsers: null,
      progressDistribution: [{ level: 'INICIAL', users: null }],
      averageAdherence: null,
      pendingInactivityAlerts: null,
      pendingCravingAlerts: null,
      updatedAt: null,
    });
  });

  it('una distribución sin niveles reconocibles queda no disponible', () => {
    expect(
      interpretar({
        datos: {
          ...DATOS,
          distribucion_niveles_progreso: [{ nivel: 'ALTO', total_usuarios: 4 }],
        },
      }).data.progressDistribution,
    ).toBeNull();
    expect(
      interpretar({
        datos: { ...DATOS, distribucion_niveles_progreso: 'INICIAL:3' },
      }).data.progressDistribution,
    ).toBeNull();
  });

  it('sin consolidar: estado funcional, sin datos y con el mensaje de la fuente', () => {
    const vista = interpretar({
      estado_agregacion: 'PENDIENTE',
      motivo_sin_datos: 'SIN_CONSOLIDAR',
      mensaje: '  Aún sin consolidar.  ',
      datos: null,
    });

    expect(vista).toMatchObject({
      status: S.NOT_CONSOLIDATED,
      data: null,
      aggregationState: 'PENDIENTE',
      message: 'Aún sin consolidar.',
    });
  });

  it('desactualizada: conserva la última vista y su fecha', () => {
    const vista = interpretar({
      estado: 'DESACTUALIZADA',
      estado_agregacion: 'ERROR_ACTUALIZACION',
      ultimo_timestamp_disponible: '2026-11-19T22:15:00Z',
    });

    expect(vista.status).toBe(S.STALE);
    expect(vista.lastAvailableAt).toBe('2026-11-19T22:15:00Z');
    expect(vista.data.activeUsers).toBe(18);
  });

  it('desactualizada con una fecha inválida: se muestra la vista sin fecha', () => {
    const vista = interpretar({
      estado: 'DESACTUALIZADA',
      ultimo_timestamp_disponible: '20/11/2026',
    });

    expect(vista.status).toBe(S.STALE);
    expect(vista.lastAvailableAt).toBeNull();
  });

  it('no disponible sin vista anterior', () => {
    expect(
      interpretar({
        estado: 'NO_DISPONIBLE',
        datos: null,
        ultimo_timestamp_disponible: null,
      }),
    ).toMatchObject({
      status: S.UNAVAILABLE,
      data: null,
    });
  });

  it('agregado suprimido: nunca muestra datos, aunque lleguen', () => {
    for (const estado of ['NO_DISPONIBLE', 'DISPONIBLE']) {
      const vista = interpretar({
        estado,
        motivo_sin_datos: 'AGREGADO_SUPRIMIDO',
      });

      expect(vista.status).toBe(S.SUPPRESSED);
      expect(vista.data).toBeNull();
      expect(vista.lastAvailableAt).toBeNull();
    }
  });

  it('respuestas contradictorias no muestran datos', () => {
    expect(interpretar({ estado: 'NO_DISPONIBLE' }).status).toBe(S.ERROR);
    expect(interpretar({ datos: null }).status).toBe(S.ERROR);
    expect(interpretar({ estado: 'OTRO' }).status).toBe(S.ERROR);
    expect(interpretBehavioralAggregate(null, COHORT).status).toBe(S.ERROR);
  });

  it('aislamiento: una respuesta de otra cohorte o sin cohorte no conserva datos', () => {
    for (const id of ['cohorte-2', '', null]) {
      const vista = interpretar({ id_cohorte: id });

      expect(vista.status).toBe(S.INCONSISTENT);
      expect(vista.data).toBeNull();
    }
  });

  it('privacidad: descarta cualquier campo individual, dentro y fuera de datos', () => {
    const individual = {
      participantes: [
        {
          id_usuario: '00000000-0000-4000-8000-0000000000aa',
          codigo: 'PART-0099',
          correo: 'x@example.com',
        },
      ],
      nombre: 'Participante ficticio',
    };
    const vista = interpretar({
      ...individual,
      datos: { ...DATOS, ...individual },
    });
    const serializada = JSON.stringify(vista);

    expect(Object.keys(vista.data).sort()).toEqual([
      'activeUsers',
      'averageAdherence',
      'pendingCravingAlerts',
      'pendingInactivityAlerts',
      'progressDistribution',
      'updatedAt',
    ]);
    expect(serializada).not.toMatch(
      /PART-|example\.com|participantes|id_usuario|0000000000aa|ficticio/,
    );
  });

  it('un rechazo se distingue por código, nunca por texto', () => {
    expect(aggregateStatusFromError({ code: 'COHORT_NOT_FOUND' })).toBe(
      S.NOT_FOUND,
    );
    expect(aggregateStatusFromError(new Error('COHORT_NOT_FOUND'))).toBe(
      S.ERROR,
    );
  });
});
