/*
 * Modo degradado (RF-149). Constantes PROVISIONALES de la interfaz.
 *
 * Según RF-149, es el BACKEND quien, ante la caída o el timeout de un
 * módulo fuente, recupera el «último estado conocido» de su caché y lo
 * entrega marcado como degradado junto con la marca temporal del último
 * dato (ultimo_timestamp_disponible, ISO 8601). El frontend no guarda
 * datos ni construye ninguna caché: solo interpreta esa marca.
 *
 * Forma PROVISIONAL en cada respuesta: { dataState, lastAvailableAt }.
 * Sin `dataState` (o con ACTUAL) la respuesta es actual.
 */
export const DATA_STATE = Object.freeze({
  CURRENT: 'ACTUAL',
  DEGRADED: 'DEGRADADO',
});

/*
 * Resultado de interpretar la marca:
 * - CURRENT: datos actuales;
 * - STALE: datos anteriores autorizados con fecha confiable (se muestran
 *   con advertencia);
 * - STALE_UNDATED: degradado sin fecha confiable (no se muestran: no se
 *   puede saber su antigüedad);
 * - INVALID: marca desconocida (se trata como error).
 */
export const FRESHNESS_STATE = Object.freeze({
  CURRENT: 'CURRENT',
  STALE: 'STALE',
  STALE_UNDATED: 'STALE_UNDATED',
  INVALID: 'INVALID',
});
