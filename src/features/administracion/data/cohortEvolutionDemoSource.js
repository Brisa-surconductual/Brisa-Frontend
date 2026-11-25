import { EVOLUTION_QUERY_ERROR } from '../types/cohortEvolution.js';
import {
  EVOLUTION_DEMO_SCENARIO as SCENARIO,
  getEvolutionDemoScenario,
} from '../utils/cohortEvolutionDemoScenario.js';
import {
  DEMO_COHORT_UNITS,
  DEMO_EVOLUTION_FILTERS,
  DEMO_EVOLUTION_FORBIDDEN_FIELDS,
  DEMO_EVOLUTION_SERIES,
  DEMO_EVOLUTION_TIMESTAMP,
} from './cohortEvolutionDemoData.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE LA EVOLUCIÓN TEMPORAL (solo desarrollo). Solo
 * la carga cohortEvolutionSource.js mediante import() dinámico cuando el
 * modo demo está activo; en producción no llega al build.
 *
 * Simula dos puertos: el catálogo de unidades del cronograma de la
 * cohorte (RF-55) y la serie de RF-141 (RF-78). No representa a M05 ni
 * al backend real. Los valores son fijos; ante una caída de M05 nunca
 * se entrega una serie parcial.
 */
export const EVOLUTION_DEMO_DELAY_MS = 400;

const pause = () =>
  new Promise((resolve) => setTimeout(resolve, EVOLUTION_DEMO_DELAY_MS));

const codedError = (code, message) =>
  Object.assign(new Error(message), { code });

async function prepare(cohortId) {
  const scenario = getEvolutionDemoScenario();

  if (scenario === SCENARIO.LOADING) await new Promise(() => {});

  await pause();

  if (scenario === SCENARIO.NO_COHORT || !DEMO_COHORT_UNITS[cohortId]) {
    throw codedError(
      EVOLUTION_QUERY_ERROR.COHORT_NOT_FOUND,
      'Cohorte inexistente en la demostración.',
    );
  }

  if (scenario === SCENARIO.FORBIDDEN) {
    throw codedError(EVOLUTION_QUERY_ERROR.FORBIDDEN, 'Sin permisos (demo).');
  }

  return scenario;
}

// Catálogo de unidades temporales del cronograma de la cohorte (RF-55).
export async function getScheduleUnits(cohortId) {
  await prepare(cohortId);
  return DEMO_COHORT_UNITS[cohortId];
}

// Marca como unidades sin datos las posiciones indicadas.
function withGaps(series, positions) {
  const blank = (values) =>
    values.map((value, index) => (positions.includes(index) ? null : value));

  return {
    ...series,
    serie_adherencia_promedio: blank(series.serie_adherencia_promedio),
    serie_nivel_progreso_distribucion: blank(
      series.serie_nivel_progreso_distribucion,
    ),
    serie_craving_promedio: blank(series.serie_craving_promedio),
    unidades_con_datos_insuficientes: positions.map(
      (index) => series.serie_unidades_temporales[index],
    ),
  };
}

const firstUnits = (series, count) => ({
  serie_unidades_temporales: series.serie_unidades_temporales.slice(0, count),
  serie_adherencia_promedio: series.serie_adherencia_promedio.slice(0, count),
  serie_nivel_progreso_distribucion:
    series.serie_nivel_progreso_distribucion.slice(0, count),
  serie_craving_promedio: series.serie_craving_promedio.slice(0, count),
});

/*
 * Serie de RF-141 para la cohorte. `filters` (RF-135, opcional) solo se
 * devuelve como filtros_aplicados: la demostración no filtra datos.
 */
export async function getCohortEvolution(cohortId, { filters = null } = {}) {
  const scenario = await prepare(cohortId);

  if (scenario === SCENARIO.SOURCE_UNAVAILABLE) {
    throw codedError(
      EVOLUTION_QUERY_ERROR.SOURCE_UNAVAILABLE,
      'Seguimiento no disponible en la demostración.',
    );
  }

  if (scenario === SCENARIO.BUILD_ERROR) {
    throw codedError(
      EVOLUTION_QUERY_ERROR.BUILD_ERROR,
      'Error simulado al construir la serie.',
    );
  }

  const base = DEMO_EVOLUTION_SERIES[cohortId];
  const all = base.serie_unidades_temporales.map((_, index) => index);
  let series = { ...base, unidades_con_datos_insuficientes: [] };

  switch (scenario) {
    case SCENARIO.ONE_GAP:
      series = withGaps(base, [2]);
      break;
    case SCENARIO.SEVERAL_GAPS:
      series = withGaps(base, [1, 3, 4]);
      break;
    case SCENARIO.ONE_UNIT:
      series = { ...firstUnits(base, 1), unidades_con_datos_insuficientes: [] };
      break;
    case SCENARIO.NO_UNITS:
      series = { ...firstUnits(base, 0), unidades_con_datos_insuficientes: [] };
      break;
    case SCENARIO.ZEROS:
      // Unidad 2: ceros reales; unidad 3: sin datos (null).
      series = withGaps(base, [2]);
      series = {
        ...series,
        serie_adherencia_promedio: series.serie_adherencia_promedio.map(
          (value, index) => (index === 1 ? 0 : value),
        ),
        serie_nivel_progreso_distribucion:
          series.serie_nivel_progreso_distribucion.map((value, index) =>
            index === 1
              ? { INICIAL: 0, EN_AVANCE: 0, AVANZADO: 0, COMPLETADO: 0 }
              : value,
          ),
        serie_craving_promedio: series.serie_craving_promedio.map(
          (value, index) => (index === 1 ? 0 : value),
        ),
      };
      break;
    case SCENARIO.NO_INFORMATION:
      series = withGaps(base, all);
      break;
    case SCENARIO.NO_FILTER_RESULTS:
      series = withGaps(base, all);
      filters = filters ?? DEMO_EVOLUTION_FILTERS;
      break;
    case SCENARIO.INCONSISTENT:
      series = {
        ...series,
        serie_craving_promedio: base.serie_craving_promedio.slice(0, -1),
      };
      break;
    default:
      break;
  }

  // Campos individuales añadidos a propósito: deben descartarse.
  return {
    id_cohorte: cohortId,
    ...series,
    filtros_aplicados: filters,
    fecha_actualizacion: DEMO_EVOLUTION_TIMESTAMP,
    ...DEMO_EVOLUTION_FORBIDDEN_FIELDS,
  };
}
