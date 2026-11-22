import { describe, expect, it } from 'vitest';

import {
  DEMO_NOTIFICATION_DATA,
  DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
} from '../data/notificationAggregateDemoData.js';
import { AGGREGATE_VIEW_STATUS as S } from '../types/behavioralAggregate.js';
import {
  aggregateStatusFromError,
  interpretNotificationAggregate,
} from './notificationAggregateResponse.js';

const COHORT = 'demo-cohorte-b';

// Respuesta del contrato de referencia de RF-134.
const response = (changes = {}) => ({
  id_cohorte: COHORT,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: '2026-11-15T05:00:00Z',
  motivo_sin_datos: null,
  mensaje: null,
  datos: {
    tasa_apertura_promedio: 0.61,
    tasa_conversion_promedio: 0.34,
    total_notificaciones_enviadas: 1260,
    total_notificaciones_entregadas: 1198,
    total_notificaciones_descartadas: 62,
  },
  ...changes,
});

const interpret = (changes) =>
  interpretNotificationAggregate(response(changes), COHORT);

const withData = (datos) =>
  interpret({ datos: { ...response().datos, ...datos } });

describe('Efectividad de notificaciones (RF-134): datos disponibles', () => {
  it('conserva los cinco indicadores tal como llegan', () => {
    const view = interpret();

    expect(view.status).toBe(S.READY);
    expect(view.data).toEqual({
      averageOpenRate: 0.61,
      averageConversionRate: 0.34,
      sentNotifications: 1260,
      deliveredNotifications: 1198,
      discardedNotifications: 62,
      updatedAt: null,
    });
    expect(view.lastAvailableAt).toBe('2026-11-15T05:00:00Z');
  });

  it('no recalcula: tasas sin convertir a porcentaje ni redondear, totales sin cruzar', () => {
    const view = withData({
      tasa_apertura_promedio: 0.123456789,
      tasa_conversion_promedio: 1.5,
      total_notificaciones_enviadas: 10,
      total_notificaciones_entregadas: 50,
      total_notificaciones_descartadas: 70,
    });

    expect(view.data).toMatchObject({
      averageOpenRate: 0.123456789,
      averageConversionRate: 1.5,
      sentNotifications: 10,
      deliveredNotifications: 50,
      discardedNotifications: 70,
    });
  });

  it('cero envíos con tasas null: totales en 0 y tasas null, sin error', () => {
    const view = withData({
      tasa_apertura_promedio: null,
      tasa_conversion_promedio: null,
      total_notificaciones_enviadas: 0,
      total_notificaciones_entregadas: 0,
      total_notificaciones_descartadas: 0,
    });

    expect(view.status).toBe(S.READY);
    expect(view.data).toMatchObject({
      averageOpenRate: null,
      averageConversionRate: null,
      sentNotifications: 0,
      deliveredNotifications: 0,
      discardedNotifications: 0,
    });
  });

  it('una tasa 0 real se conserva; NO_CALCULABLE, texto o ausente es null', () => {
    const view = withData({
      tasa_apertura_promedio: 0,
      tasa_conversion_promedio: 'NO_CALCULABLE',
      total_notificaciones_descartadas: undefined,
      total_notificaciones_entregadas: '1198',
    });

    expect(view.data.averageOpenRate).toBe(0);
    expect(view.data.averageConversionRate).toBeNull();
    expect(view.data.discardedNotifications).toBeNull();
    expect(view.data.deliveredNotifications).toBeNull();
  });

  it('conserva fecha_actualizacion de RF-101 si llega', () => {
    expect(
      withData({ fecha_actualizacion: '2026-11-16T10:00:00Z' }).data.updatedAt,
    ).toBe('2026-11-16T10:00:00Z');
  });

  it('usuarios sin métricas calculables: el aviso de M07 acompaña al agregado sin bloquearlo', () => {
    const view = interpret({ mensaje: 'Algunos usuarios fueron excluidos.' });

    expect(view.status).toBe(S.READY);
    expect(view.message).toBe('Algunos usuarios fueron excluidos.');
    expect(view.data.averageOpenRate).toBe(0.61);
  });
});

describe('Efectividad de notificaciones (RF-134): estados sin datos', () => {
  it('sin consolidar con datos null es funcional y distinto de cero envíos', () => {
    const view = interpret({
      estado_agregacion: 'PENDIENTE',
      motivo_sin_datos: 'SIN_CONSOLIDAR',
      datos: null,
    });

    expect(view).toMatchObject({
      status: S.NOT_CONSOLIDATED,
      aggregationState: 'PENDIENTE',
      data: null,
    });
  });

  it('desactualizada: conserva la última vista válida con su fecha', () => {
    const view = interpret({
      estado: 'DESACTUALIZADA',
      estado_agregacion: 'ERROR_ACTUALIZACION',
    });

    expect(view.status).toBe(S.STALE);
    expect(view.data.sentNotifications).toBe(1260);
    expect(view.lastAvailableAt).toBe('2026-11-15T05:00:00Z');
  });

  it('M07 no disponible sin última vista: ningún dato', () => {
    expect(
      interpret({
        estado: 'NO_DISPONIBLE',
        datos: null,
        ultimo_timestamp_disponible: null,
      }),
    ).toMatchObject({ status: S.UNAVAILABLE, data: null });
  });

  it('respuestas contradictorias o inválidas no muestran datos', () => {
    expect(interpret({ estado: 'NO_DISPONIBLE' })).toMatchObject({
      status: S.ERROR,
      data: null,
    });
    expect(interpret({ datos: null }).status).toBe(S.ERROR);
    expect(interpretNotificationAggregate(undefined, COHORT).status).toBe(
      S.ERROR,
    );
  });

  it('rechazos: cohorte inexistente por código y fallo genérico', () => {
    expect(aggregateStatusFromError({ code: 'COHORT_NOT_FOUND' })).toBe(
      S.NOT_FOUND,
    );
    expect(aggregateStatusFromError(new Error('503'))).toBe(S.ERROR);
  });
});

describe('Efectividad de notificaciones (RF-134): aislamiento y privacidad', () => {
  it('la respuesta de otra cohorte no deja ningún dato', () => {
    expect(
      interpretNotificationAggregate(response(), 'demo-cohorte-c'),
    ).toMatchObject({ status: S.INCONSISTENT, data: null });
  });

  it('descarta métricas por usuario, historial, contenido, tipos e identificadores', () => {
    const view = interpretNotificationAggregate(
      {
        ...response({
          datos: {
            ...DEMO_NOTIFICATION_DATA[COHORT],
            ...DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
          },
        }),
        ...DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
      },
      COHORT,
    );

    expect(Object.keys(view.data).sort()).toEqual([
      'averageConversionRate',
      'averageOpenRate',
      'deliveredNotifications',
      'discardedNotifications',
      'sentNotifications',
      'updatedAt',
    ]);
    expect(JSON.stringify(view)).not.toMatch(
      /PART-|example\.com|0000000000c|ficticio|RECORDATORIO|ABIERTA|0\.05|0\.25/,
    );
  });
});
