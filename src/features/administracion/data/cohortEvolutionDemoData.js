/*
 * DATOS FICTICIOS de la evolución temporal (RF-141), solo para el modo de
 * demostración y las pruebas. No provienen de M05 ni del backend. Todos
 * son agregados de cohorte, fijos (sin valores aleatorios) y no se
 * calculan a partir de los participantes ficticios del M08.
 *
 * 1. CATÁLOGO SIMULADO EXPLÍCITO de unidades temporales del cronograma
 *    (RF-55): { id_unidad_temporal, etiqueta, orden }. Es la única fuente
 *    de la etiqueta visible y del orden de cada unidad: el UUID no indica
 *    nada (a propósito, no están en orden alfabético).
 * 2. Series de cada cohorte con el contrato de RF-141, por unidad
 *    transcurrida. Las escalas de adherencia y craving no están
 *    confirmadas: los valores son solo ilustrativos.
 */
const unit = (id, etiqueta, orden) =>
  Object.freeze({ id_unidad_temporal: id, etiqueta, orden });

// Cronograma demostrativo 1 (cohortes Piloto A y B).
export const DEMO_SCHEDULE_1_UNITS = Object.freeze([
  unit('7c1e9a40-3b2d-4f6a-9e10-0a1b2c3d4e01', 'Semana 1', 1),
  unit('2f8d4b6c-1a3e-4c5d-8f20-0a1b2c3d4e02', 'Semana 2', 2),
  unit('e04a7c19-5d6b-4a2f-9c30-0a1b2c3d4e03', 'Semana 3', 3),
  unit('51b3d8e2-7f4c-4b1a-8d40-0a1b2c3d4e04', 'Semana 4', 4),
  unit('9a6f2c7d-2e8b-4d3c-9b50-0a1b2c3d4e05', 'Semana 5', 5),
  unit('0d5e1f3a-8c9b-4e7d-8a60-0a1b2c3d4e06', 'Semana 6', 6),
  unit('c3a9e5b1-4d2f-4a8e-9f70-0a1b2c3d4e07', 'Semana 7', 7),
  unit('68e2b4d0-9f1a-4c6b-8e80-0a1b2c3d4e08', 'Semana 8', 8),
]);

// Cronograma demostrativo 2 (cohorte Piloto C).
export const DEMO_SCHEDULE_2_UNITS = Object.freeze([
  unit('b7d1c3e5-6a2f-4b9c-8d11-1f2e3d4c5b01', 'Unidad 1', 1),
  unit('4e9a2b6d-3c8f-4d1e-9a12-1f2e3d4c5b02', 'Unidad 2', 2),
  unit('f2c8d5a1-7b3e-4c6f-8b13-1f2e3d4c5b03', 'Unidad 3', 3),
  unit('1a7e4f9b-5d2c-4e8a-9c14-1f2e3d4c5b04', 'Unidad 4', 4),
  unit('8d3b6e2f-1c9a-4f5d-8e15-1f2e3d4c5b05', 'Unidad 5', 5),
]);

export const DEMO_COHORT_UNITS = Object.freeze({
  'demo-cohorte-a': DEMO_SCHEDULE_1_UNITS,
  'demo-cohorte-b': DEMO_SCHEDULE_1_UNITS,
  'demo-cohorte-c': DEMO_SCHEDULE_2_UNITS,
});

export const DEMO_EVOLUTION_TIMESTAMP = '2026-11-21T12:00:00Z';

const level = (inicial, enAvance, avanzado, completado) =>
  Object.freeze({
    INICIAL: inicial,
    EN_AVANCE: enAvance,
    AVANZADO: avanzado,
    COMPLETADO: completado,
  });

const ids = (units, count) =>
  Object.freeze(units.slice(0, count).map((item) => item.id_unidad_temporal));

/*
 * Series válidas por cohorte (unidades transcurridas, en orden). Los
 * escenarios de la fuente de demostración parten de estas series.
 */
export const DEMO_EVOLUTION_SERIES = Object.freeze({
  'demo-cohorte-a': Object.freeze({
    serie_unidades_temporales: ids(DEMO_SCHEDULE_1_UNITS, 1),
    serie_adherencia_promedio: Object.freeze([0.81]),
    serie_nivel_progreso_distribucion: Object.freeze([level(9, 3, 0, 0)]),
    serie_craving_promedio: Object.freeze([5.4]),
  }),
  'demo-cohorte-b': Object.freeze({
    serie_unidades_temporales: ids(DEMO_SCHEDULE_1_UNITS, 6),
    serie_adherencia_promedio: Object.freeze([
      0.82, 0.79, 0.74, 0.71, 0.73, 0.7342,
    ]),
    serie_nivel_progreso_distribucion: Object.freeze([
      level(14, 4, 0, 0),
      level(10, 7, 1, 0),
      level(7, 9, 2, 0),
      level(5, 9, 3, 1),
      level(4, 9, 4, 1),
      level(3, 9, 4, 2),
    ]),
    serie_craving_promedio: Object.freeze([6.1, 5.8, 5.9, 5.2, 4.8, 4.6]),
  }),
  'demo-cohorte-c': Object.freeze({
    serie_unidades_temporales: ids(DEMO_SCHEDULE_2_UNITS, 4),
    serie_adherencia_promedio: Object.freeze([0.66, 0.61, 0.64, 0.6125]),
    serie_nivel_progreso_distribucion: Object.freeze([
      level(6, 4, 1, 0),
      level(4, 4, 2, 1),
      level(2, 3, 3, 3),
      level(1, 2, 3, 5),
    ]),
    serie_craving_promedio: Object.freeze([4.9, 5.3, 5.1, 5.6]),
  }),
});

// Filtros de ejemplo del escenario filtros-sin-resultados (nombres
// PROVISIONALES: RF-135 aún no define su contrato).
export const DEMO_EVOLUTION_FILTERS = Object.freeze({
  modalidad_terapeutica: 'PERSONALIZADA',
  rango_fechas: Object.freeze({ desde: '2026-09-01', hasta: '2026-09-30' }),
});

/*
 * Datos individuales que la fuente ficticia añade a propósito: la
 * interfaz debe descartarlos (RF-141: estrictamente agregada). Valores
 * ficticios reconocibles (PART-NNNN, example.com).
 */
export const DEMO_EVOLUTION_FORBIDDEN_FIELDS = Object.freeze({
  registros_individuales: Object.freeze([
    Object.freeze({
      id_usuario: '00000000-0000-4000-8000-0000000000ee',
      codigo: 'PART-0096',
      nombre: 'Participante evolución ficticio',
      correo: 'evolucion.ficticia@example.com',
      adherencia: 0.12,
      craving: 9.9,
      respuesta_diario: 'Texto ficticio del diario',
    }),
  ]),
});
