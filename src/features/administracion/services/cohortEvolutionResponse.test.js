import { describe, expect, it } from 'vitest';

import {
  DEMO_EVOLUTION_FORBIDDEN_FIELDS,
  DEMO_SCHEDULE_1_UNITS,
} from '../data/cohortEvolutionDemoData.js';
import { EVOLUTION_STATUS as S } from '../types/cohortEvolution.js';
import {
  evolutionStatusFromError,
  interpretCohortEvolution,
} from './cohortEvolutionResponse.js';

const COHORT = 'co-1';
const CATALOG = DEMO_SCHEDULE_1_UNITS;
const ID = CATALOG.map(({ id_unidad_temporal: id }) => id);

const dist = (inicial, enAvance, avanzado, completado) => ({
  INICIAL: inicial,
  EN_AVANCE: enAvance,
  AVANZADO: avanzado,
  COMPLETADO: completado,
});

const response = (changes = {}) => ({
  serie_unidades_temporales: [ID[0], ID[1], ID[2]],
  serie_adherencia_promedio: [0.82, 0.79, 0.74],
  serie_nivel_progreso_distribucion: [
    dist(14, 4, 0, 0),
    dist(10, 7, 1, 0),
    dist(7, 9, 2, 0),
  ],
  serie_craving_promedio: [6.1, 5.8, 5.9],
  unidades_con_datos_insuficientes: [],
  fecha_actualizacion: '2026-11-21T12:00:00Z',
  ...changes,
});

const interpret = (changes, catalog = CATALOG) =>
  interpretCohortEvolution(response(changes), catalog, COHORT);

describe('Evolución temporal (RF-141): serie válida', () => {
  it('alinea las tres series por unidad, con la etiqueta del catálogo', () => {
    const view = interpret();

    expect(view.status).toBe(S.READY);
    expect(view.units.map(({ label }) => label)).toEqual([
      'Semana 1',
      'Semana 2',
      'Semana 3',
    ]);
    expect(view.units[1]).toMatchObject({
      id: ID[1],
      adherence: 0.79,
      craving: 5.8,
      insufficient: false,
    });
    expect(view.units[1].distribution).toEqual([
      { level: 'INICIAL', users: 10 },
      { level: 'EN_AVANCE', users: 7 },
      { level: 'AVANZADO', users: 1 },
      { level: 'COMPLETADO', users: 0 },
    ]);
    expect(view.updatedAt).toBe('2026-11-21T12:00:00Z');
  });

  it('conserva los valores originales: sin redondear ni recalcular', () => {
    const view = interpret({
      serie_adherencia_promedio: [0.123456789, 1.5, 3],
    });

    expect(view.units.map(({ adherence }) => adherence)).toEqual([
      0.123456789, 1.5, 3,
    ]);
    expect(Object.keys(view.units[0]).sort()).toEqual([
      'adherence',
      'craving',
      'distribution',
      'id',
      'insufficient',
      'label',
    ]);
  });

  it('el orden y la etiqueta salen del catálogo, no del UUID', () => {
    // Catálogo con los mismos UUID pero otro orden: la serie no lo sigue.
    const reordered = CATALOG.map((unit, index) => ({
      ...unit,
      orden: CATALOG.length - index,
    }));

    expect(interpret({}, reordered).status).toBe(S.ERROR);
    // Los UUID del catálogo no están ordenados alfabéticamente.
    expect([...ID].sort()).not.toEqual(ID);
  });

  it('distingue el cero real de null («sin datos»)', () => {
    const view = interpret({
      serie_adherencia_promedio: [0, null, 0.74],
      serie_craving_promedio: [0, null, 5.9],
      serie_nivel_progreso_distribucion: [
        dist(0, 0, 0, 0),
        null,
        dist(7, 9, 2, 0),
      ],
    });

    expect(view.units[0]).toMatchObject({ adherence: 0, craving: 0 });
    expect(view.units[0].distribution.every(({ users }) => users === 0)).toBe(
      true,
    );
    expect(view.units[1]).toMatchObject({
      adherence: null,
      craving: null,
      distribution: null,
    });
  });

  it('una distribución vacía o sin niveles conocidos es ausente, no ceros', () => {
    const view = interpret({
      serie_nivel_progreso_distribucion: [
        {},
        { OTRO: 3 },
        dist(7, null, 2, undefined),
      ],
    });

    expect(view.units[0].distribution).toBeNull();
    expect(view.units[1].distribution).toBeNull();
    expect(view.units[2].distribution).toEqual([
      { level: 'INICIAL', users: 7 },
      { level: 'EN_AVANCE', users: null },
      { level: 'AVANZADO', users: 2 },
      { level: 'COMPLETADO', users: null },
    ]);
  });

  it('identifica las unidades con datos insuficientes y conserva su posición', () => {
    const view = interpret({
      serie_adherencia_promedio: [0.82, null, 0.74],
      serie_nivel_progreso_distribucion: [
        dist(1, 1, 1, 1),
        null,
        dist(1, 1, 1, 1),
      ],
      serie_craving_promedio: [6.1, null, 5.9],
      unidades_con_datos_insuficientes: [ID[1]],
    });

    expect(view.status).toBe(S.READY);
    expect(view.hasGaps).toBe(true);
    expect(view.units.map(({ insufficient }) => insufficient)).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe('Evolución temporal (RF-141): estados funcionales', () => {
  it.each([[[ID[0]]], [[]]])(
    'menos de dos unidades: estado funcional',
    (ids) => {
      const view = interpret({
        serie_unidades_temporales: ids,
        serie_adherencia_promedio: ids.map(() => 0.8),
        serie_nivel_progreso_distribucion: ids.map(() => dist(1, 1, 1, 1)),
        serie_craving_promedio: ids.map(() => 5),
      });

      expect(view.status).toBe(S.INSUFFICIENT_UNITS);
      expect(view.units).toEqual([]);
    },
  );

  it('ninguna unidad con datos: sin datos, o sin resultados si hay filtros', () => {
    const empty = {
      serie_adherencia_promedio: [null, null, null],
      serie_nivel_progreso_distribucion: [null, null, null],
      serie_craving_promedio: [null, null, null],
      unidades_con_datos_insuficientes: [ID[0], ID[1], ID[2]],
    };

    expect(interpret(empty).status).toBe(S.NO_DATA);

    const filtered = interpret({
      ...empty,
      filtros_aplicados: {
        modalidad_terapeutica: 'PERSONALIZADA',
        rango_fechas: { desde: '2026-09-01', hasta: '2026-09-30' },
        otro_campo: 'descartado',
      },
    });

    expect(filtered.status).toBe(S.NO_FILTER_RESULTS);
    expect(filtered.units).toEqual([]);
    expect(filtered.filters).toEqual({
      therapyModality: 'PERSONALIZADA',
      dateRange: { from: '2026-09-01', to: '2026-09-30' },
    });
  });
});

describe('Evolución temporal (RF-141): series inconsistentes', () => {
  it.each([
    ['longitudes distintas', { serie_craving_promedio: [6.1, 5.8] }],
    [
      'unidad intermedia omitida',
      { serie_unidades_temporales: [ID[0], ID[2], ID[3]] },
    ],
    [
      'orden distinto al del cronograma',
      { serie_unidades_temporales: [ID[1], ID[0], ID[2]] },
    ],
    [
      'unidad fuera del catálogo',
      { serie_unidades_temporales: [ID[0], ID[1], 'x'] },
    ],
    ['unidad repetida', { serie_unidades_temporales: [ID[0], ID[0], ID[1]] }],
    [
      'insuficiente que no está en la serie',
      { unidades_con_datos_insuficientes: [ID[5]] },
    ],
    ['insuficiente con valores', { unidades_con_datos_insuficientes: [ID[0]] }],
    ['valor no numérico', { serie_adherencia_promedio: ['0,8', 0.79, 0.74] }],
    [
      'cantidad inválida',
      { serie_nivel_progreso_distribucion: [dist(-1, 0, 0, 0), null, null] },
    ],
    ['otra cohorte', { id_cohorte: 'co-2' }],
  ])('%s: no se presenta la serie', (_, changes) => {
    expect(interpret(changes)).toMatchObject({ status: S.ERROR, units: [] });
  });

  it('sin catálogo válido no se puede ordenar ni etiquetar la serie', () => {
    expect(interpret({}, null).status).toBe(S.ERROR);
    expect(interpret({}, [{ id_unidad_temporal: ID[0] }]).status).toBe(S.ERROR);
  });
});

describe('Evolución temporal (RF-141): errores y privacidad', () => {
  it.each([
    ['COHORT_NOT_FOUND', S.NOT_FOUND],
    ['FORBIDDEN', S.FORBIDDEN],
    ['M05_UNAVAILABLE', S.UNAVAILABLE],
    ['DASHBOARD_TIMEOUT', S.UNAVAILABLE],
    ['SERIES_BUILD_ERROR', S.ERROR],
  ])('código %s', (code, status) => {
    expect(evolutionStatusFromError({ code })).toBe(status);
  });

  it('descarta registros individuales y cualquier campo fuera del contrato', () => {
    const view = interpret({
      ...DEMO_EVOLUTION_FORBIDDEN_FIELDS,
      serie_nivel_progreso_distribucion: [
        { ...dist(1, 1, 1, 1), id_usuario: 'x', PART: 1 },
        dist(1, 1, 1, 1),
        dist(1, 1, 1, 1),
      ],
    });

    expect(JSON.stringify(view)).not.toMatch(
      /PART-|example\.com|0000000000ee|ficticio|diario|id_usuario/,
    );
  });
});
