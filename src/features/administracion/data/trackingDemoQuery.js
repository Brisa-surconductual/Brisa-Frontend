import { PROGRESS_LEVELS, SORT_DIRECTION, TRACKING_ALERT_FILTER, TRACKING_SORT_FIELD } from '../types/participantTracking.js';

/*
 * EMULACIÓN DEL SERVIDOR (solo demostración). Replica la política del
 * backend de RF-142 (listado-indicadores.policy) sobre las filas con la
 * forma real, para que la interfaz nunca filtre ni ordene por su cuenta:
 *   - filtros combinados; con un rango de adherencia, una fila sin
 *     adherencia (null) queda fuera;
 *   - `con_alertas` mira las alertas activas sin atender;
 *   - el nivel se ordena por su orden canónico, no alfabético;
 *   - las filas sin dato van siempre al final; desempate por código;
 *   - sin orden pedido: código ascendente.
 */
function matches(row, { level, adherenceMin, adherenceMax, alerts }) {
  if (level !== null && row.nivel_progreso !== level) return false;
  if (adherenceMin !== null || adherenceMax !== null) {
    if (row.tasa_adherencia === null) return false;
    if (adherenceMin !== null && row.tasa_adherencia < adherenceMin / 100) return false;
    if (adherenceMax !== null && row.tasa_adherencia > adherenceMax / 100) return false;
  }
  if (alerts === TRACKING_ALERT_FILTER.WITH_ALERTS) return row.alertas_activas > 0;
  if (alerts === TRACKING_ALERT_FILTER.WITHOUT_ALERTS) return row.alertas_activas === 0;

  return true;
}

function valueOf(row, field) {
  if (field === TRACKING_SORT_FIELD.PROGRESS) {
    return row.nivel_progreso === null ? null : PROGRESS_LEVELS.indexOf(row.nivel_progreso);
  }

  return row[field];
}

function compare({ field, direction }) {
  const sign = direction === SORT_DIRECTION.DESC ? -1 : 1;

  return (a, b) => {
    const va = valueOf(a, field);
    const vb = valueOf(b, field);

    if (va !== vb) {
      if (va === null) return 1;
      if (vb === null) return -1;
      return (va < vb ? -1 : 1) * sign;
    }

    return a.codigo_participante < b.codigo_participante ? -1 : a.codigo_participante > b.codigo_participante ? 1 : 0;
  };
}

const DEFAULT_SORT = Object.freeze({ field: TRACKING_SORT_FIELD.CODE, direction: SORT_DIRECTION.ASC });

export function applyTrackingQuery(rows, query) {
  const ordered = rows.filter((row) => matches(row, query.filters)).sort(compare(query.sort ?? DEFAULT_SORT));

  return {
    total: ordered.length,
    items: ordered.slice(query.offset, query.offset + query.limit),
  };
}
