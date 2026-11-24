import { PROGRESS_LEVEL } from '../types/behavioralAggregate.js';
import { DASHBOARD_TIMEOUT_CODE } from '../types/cohortDashboard.js';
import {
  EVOLUTION_MIN_UNITS,
  EVOLUTION_QUERY_ERROR,
  EVOLUTION_STATUS as S,
} from '../types/cohortEvolution.js';

import { text, timestamp } from './aggregateViewEnvelope.js';

/*
 * Interpreta y valida la serie de RF-141 frente al catálogo de unidades
 * del cronograma (RF-55). Pura. Nada se calcula, interpola ni reordena:
 * si la serie no es coherente, no se presenta (ERROR, «no fue posible
 * construir la evolución»), en lugar de mostrar una secuencia engañosa.
 *
 * Validaciones:
 * 1. La respuesta, si declara id_cohorte, debe ser la de la cohorte pedida.
 * 2. Las tres series tienen la misma longitud que serie_unidades_temporales
 *    (sin identificadores vacíos ni repetidos).
 * 3. unidades_con_datos_insuficientes es un subconjunto de la serie, y
 *    esas unidades no traen valores.
 * 4. Cada unidad existe en el catálogo; la serie sigue el orden oficial
 *    del cronograma y no omite unidades intermedias. El orden y la
 *    etiqueta visibles salen del catálogo, nunca del UUID.
 * 5. Valores originales: número finito o null («sin datos», nunca 0).
 *    Una distribución ausente es null, nunca una distribución de ceros.
 *
 * LISTA EXPLÍCITA de campos: los del contrato de RF-141 y, de RF-141 v1.0.1,
 * id_cohorte y filtros_aplicados (nombres internos PROVISIONALES: RF-135
 * aún no define su contrato). Todo lo demás se descarta.
 */
const LEVELS = Object.freeze(Object.values(PROGRESS_LEVEL));

const isCount = (value) => Number.isInteger(value) && value >= 0;
const isValue = (value) =>
  value === null || (typeof value === 'number' && Number.isFinite(value));

const result = (status, fields = {}) =>
  Object.freeze({
    status,
    units: Object.freeze([]),
    updatedAt: null,
    filters: null,
    hasGaps: false,
    ...fields,
  });

// Catálogo ordenado: id → { position, label }; null si no es válido.
function catalogIndex(catalog) {
  if (!Array.isArray(catalog)) return null;

  const items = catalog.map((item) => ({
    id: text(item?.id_unidad_temporal),
    label: text(item?.etiqueta),
    order: item?.orden,
  }));

  if (
    items.some(
      ({ id, label, order }) => !id || !label || !Number.isInteger(order),
    ) ||
    new Set(items.map(({ id }) => id)).size !== items.length ||
    new Set(items.map(({ order }) => order)).size !== items.length
  ) {
    return null;
  }

  const sorted = [...items].sort((a, b) => a.order - b.order);

  return new Map(
    sorted.map(({ id, label }, position) => [id, { position, label }]),
  );
}

// Distribución de RF-70; undefined si no es válida.
function distributionOf(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return undefined;

  if (!LEVELS.some((level) => Object.hasOwn(value, level))) return null;

  if (
    LEVELS.some(
      (level) =>
        value[level] !== undefined &&
        value[level] !== null &&
        !isCount(value[level]),
    )
  ) {
    return undefined;
  }

  return Object.freeze(
    LEVELS.map((level) =>
      Object.freeze({
        level,
        users: isCount(value[level]) ? value[level] : null,
      }),
    ),
  );
}

// Filtros aplicados de RF-135 (solo lectura, para mostrarlos).
function filtersOf(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const therapyModality = text(value.modalidad_terapeutica);
  const from = text(value.rango_fechas?.desde);
  const to = text(value.rango_fechas?.hasta);

  if (!therapyModality && !from && !to) return null;

  return Object.freeze({
    therapyModality,
    dateRange: from || to ? Object.freeze({ from, to }) : null,
  });
}

export function interpretCohortEvolution(response, catalog, requestedCohortId) {
  if (!response || typeof response !== 'object') return result(S.ERROR);

  if (
    response.id_cohorte !== undefined &&
    text(response.id_cohorte) !== requestedCohortId
  ) {
    return result(S.ERROR);
  }

  const ids = response.serie_unidades_temporales;

  if (
    !Array.isArray(ids) ||
    ids.some((id) => !text(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return result(S.ERROR);
  }

  const adherence = response.serie_adherencia_promedio;
  const distribution = response.serie_nivel_progreso_distribucion;
  const craving = response.serie_craving_promedio;

  if (
    [adherence, distribution, craving].some(
      (series) => !Array.isArray(series) || series.length !== ids.length,
    )
  ) {
    return result(S.ERROR);
  }

  const insufficient = response.unidades_con_datos_insuficientes;

  if (
    !Array.isArray(insufficient) ||
    insufficient.some((id) => !ids.includes(id))
  ) {
    return result(S.ERROR);
  }

  const updatedAt = timestamp(response.fecha_actualizacion);
  const filters = filtersOf(response.filtros_aplicados);

  if (ids.length < EVOLUTION_MIN_UNITS) {
    return result(S.INSUFFICIENT_UNITS, { updatedAt, filters });
  }

  const index = catalogIndex(catalog);
  const positions = ids.map((id) => index?.get(id)?.position);

  if (
    positions.some((position) => position === undefined) ||
    positions.some((position, i) => i > 0 && position !== positions[i - 1] + 1)
  ) {
    return result(S.ERROR);
  }

  const units = [];

  for (const [i, id] of ids.entries()) {
    const unitDistribution = distributionOf(distribution[i]);
    const isInsufficient = insufficient.includes(id);

    if (
      !isValue(adherence[i]) ||
      !isValue(craving[i]) ||
      unitDistribution === undefined ||
      (isInsufficient &&
        (adherence[i] !== null ||
          craving[i] !== null ||
          unitDistribution !== null))
    ) {
      return result(S.ERROR);
    }

    units.push(
      Object.freeze({
        id,
        label: index.get(id).label,
        insufficient: isInsufficient,
        adherence: adherence[i],
        craving: craving[i],
        distribution: unitDistribution,
      }),
    );
  }

  const hasData = units.some(
    ({ adherence: a, craving: c, distribution: d }) =>
      a !== null || c !== null || d !== null,
  );

  if (!hasData) {
    return result(filters ? S.NO_FILTER_RESULTS : S.NO_DATA, {
      updatedAt,
      filters,
    });
  }

  return result(S.READY, {
    units: Object.freeze(units),
    updatedAt,
    filters,
    hasGaps: units.some(({ insufficient: gap }) => gap),
  });
}

// Situación ante un rechazo de la fuente; por código, nunca por texto.
export function evolutionStatusFromError(error) {
  if (error?.status === 403) return S.FORBIDDEN;
  if (error?.status === 503 && error.codigo === 'SEGUIMIENTO_NO_DISPONIBLE') {
    return S.UNAVAILABLE;
  }
  switch (error?.code) {
    case EVOLUTION_QUERY_ERROR.COHORT_NOT_FOUND:
      return S.NOT_FOUND;
    case EVOLUTION_QUERY_ERROR.FORBIDDEN:
      return S.FORBIDDEN;
    case EVOLUTION_QUERY_ERROR.SOURCE_UNAVAILABLE:
    case DASHBOARD_TIMEOUT_CODE:
      return S.UNAVAILABLE;
    default:
      return S.ERROR;
  }
}
