import { describe, expect, it } from 'vitest';

import {
  DEMO_AGGREGATE_DATA,
  DEMO_FORBIDDEN_FIELDS,
} from '../data/behavioralAggregateDemoData.js';
import {
  DEMO_NOTIFICATION_DATA,
  DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
  DEMO_NOTIFICATION_NO_SENDS,
} from '../data/notificationAggregateDemoData.js';
import { EXPORT_COLUMNS } from '../types/cohortExport.js';
import { parseCsv } from '../utils/csvTestParser.js';
import { interpretBehavioralAggregate } from './behavioralAggregateResponse.js';
import {
  buildCohortIndicatorsCsv,
  cohortIndicatorsFileName,
  projectCohortIndicators,
} from './cohortExportProjection.js';
import { interpretNotificationAggregate } from './notificationAggregateResponse.js';

const COHORT = 'demo-cohorte-b';

const envelope = (datos, changes = {}) => ({
  id_cohorte: COHORT,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: '2026-11-20T12:15:00Z',
  motivo_sin_datos: null,
  mensaje: null,
  datos,
  ...changes,
});

// Las mismas vistas interpretadas que muestran RF-132 y RF-134, con los
// campos individuales prohibidos de sus mocks.
const behavioral = (changes) =>
  interpretBehavioralAggregate(
    envelope(
      { ...DEMO_AGGREGATE_DATA[COHORT], ...DEMO_FORBIDDEN_FIELDS },
      { ...DEMO_FORBIDDEN_FIELDS, ...changes },
    ),
    COHORT,
  );
const notifications = (changes) =>
  interpretNotificationAggregate(
    envelope(
      {
        ...DEMO_NOTIFICATION_DATA[COHORT],
        ...DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
      },
      { ...DEMO_NOTIFICATION_FORBIDDEN_FIELDS, ...changes },
    ),
    COHORT,
  );

const project = (overrides = {}) =>
  projectCohortIndicators({
    cohortName: 'Cohorte Piloto B',
    behavioralView: behavioral(),
    notificationView: notifications(),
    ...overrides,
  });

describe('Proyección de exportación RF-144: lista blanca', () => {
  it('encabezados exactos y en orden fijo', () => {
    const [header] = parseCsv(buildCohortIndicatorsCsv(project()));

    expect(header).toEqual([
      'nombre_cohorte',
      'estado_vista_conductual',
      'fecha_actualizacion_conductual',
      'total_usuarios_activos',
      'usuarios_nivel_inicial',
      'usuarios_nivel_en_avance',
      'usuarios_nivel_avanzado',
      'usuarios_nivel_completado',
      'tasa_adherencia_promedio',
      'alertas_inactividad_pendientes',
      'alertas_craving_pendientes',
      'estado_vista_notificaciones',
      'fecha_actualizacion_notificaciones',
      'tasa_apertura_promedio',
      'tasa_conversion_promedio',
      'total_notificaciones_enviadas',
      'total_notificaciones_entregadas',
      'total_notificaciones_descartadas',
    ]);
    expect(Object.keys(project())).toEqual([...EXPORT_COLUMNS]);
  });

  it('los valores son los mismos que muestran RF-132 y RF-134, sin recalcular', () => {
    const [, row] = parseCsv(buildCohortIndicatorsCsv(project()));

    expect(row).toEqual([
      'Cohorte Piloto B',
      'DISPONIBLE',
      '2026-11-20T13:00:00Z',
      '18',
      '3',
      '9',
      '4',
      '2',
      '0.7342',
      '2',
      '1',
      'DISPONIBLE',
      '2026-11-20T12:15:00Z',
      '0.5825',
      '0.3125',
      '412',
      '398',
      '21',
    ]);
  });

  it('descarta datos individuales y campos adicionales de las fuentes', () => {
    const csv = buildCohortIndicatorsCsv(project());

    expect(csv).not.toMatch(
      /PART-|example\.com|0000000000|ficticio|participantes|historial|correo|nombre:|RECORDATORIO|tasa_descarte/,
    );
  });

  it('ignora propiedades extra aunque lleguen dentro de los datos visibles', () => {
    const view = behavioral();
    const tampered = {
      ...view,
      data: { ...view.data, id_usuario: 'u-1', correo: 'x@example.com' },
    };
    const projection = project({ behavioralView: tampered });

    expect(Object.keys(projection)).toEqual([...EXPORT_COLUMNS]);
    expect(buildCohortIndicatorsCsv(projection)).not.toMatch(
      /u-1|example\.com/,
    );
  });
});

describe('Proyección de exportación RF-144: datos faltantes', () => {
  it('RF-134 no disponible: CSV con la conducta y notificaciones «No disponible», nunca 0', () => {
    const [, row] = parseCsv(
      buildCohortIndicatorsCsv(project({ notificationView: null })),
    );

    expect(row.slice(0, 11)).toContain('0.7342');
    expect(row.slice(11)).toEqual([
      'NO_DISPONIBLE',
      'No disponible',
      'No disponible',
      'No disponible',
      'No disponible',
      'No disponible',
      'No disponible',
    ]);
  });

  it('RF-134 sin envíos: totales 0 reales y tasas null como «No disponible»', () => {
    const view = interpretNotificationAggregate(
      envelope(DEMO_NOTIFICATION_NO_SENDS),
      COHORT,
    );
    const p = project({ notificationView: view });

    expect(p.tasa_apertura_promedio).toBe('No disponible');
    expect(p.total_notificaciones_enviadas).toBe(0);
  });

  it('un valor conductual ausente es «No disponible», no 0', () => {
    const view = behavioral({
      datos: { ...DEMO_AGGREGATE_DATA[COHORT], tasa_adherencia_promedio: null },
    });

    expect(project({ behavioralView: view }).tasa_adherencia_promedio).toBe(
      'No disponible',
    );
  });

  it('vista desactualizada: lo indica en su columna de estado', () => {
    const p = project({
      behavioralView: behavioral({ estado: 'DESACTUALIZADA' }),
      notificationView: notifications({ estado: 'DESACTUALIZADA' }),
    });

    expect(p.estado_vista_conductual).toBe('DESACTUALIZADA');
    expect(p.estado_vista_notificaciones).toBe('DESACTUALIZADA');
  });

  it('RF-132 es obligatorio: sin datos conductuales no hay proyección', () => {
    const notConsolidated = behavioral({
      datos: null,
      motivo_sin_datos: 'SIN_CONSOLIDAR',
    });

    expect(() => project({ behavioralView: notConsolidated })).toThrow();
    expect(() => project({ behavioralView: null })).toThrow();
  });

  it('caracteres especiales en el nombre de la cohorte se escapan y se leen igual', () => {
    const name = 'Cohorte "Piloto", B\n=HIPERVINCULO()';
    const [header, row] = parseCsv(
      buildCohortIndicatorsCsv(project({ cohortName: name })),
    );

    expect(row).toHaveLength(header.length);
    expect(row[0]).toBe(name);
  });

  it('un nombre que empieza como fórmula se neutraliza', () => {
    const [, row] = parseCsv(
      buildCohortIndicatorsCsv(project({ cohortName: '=1+1' })),
    );

    expect(row[0]).toBe("'=1+1");
  });
});

describe('Nombre del archivo RF-144', () => {
  it('indicadores_cohorte_activa_YYYYMMDD.csv con la fecha de Colombia', () => {
    expect(cohortIndicatorsFileName(new Date('2026-11-22T14:00:00Z'))).toBe(
      'indicadores_cohorte_activa_20261122.csv',
    );
    // 02:00 UTC del 23 aún es el 22 en Colombia (UTC-5).
    expect(cohortIndicatorsFileName(new Date('2026-11-23T02:00:00Z'))).toBe(
      'indicadores_cohorte_activa_20261122.csv',
    );
  });
});
