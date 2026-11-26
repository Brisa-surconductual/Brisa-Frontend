import {
  PROFILE_OUTCOME,
  READ_ONLY_MODE,
} from '../types/participantTracking.js';

/*
 * Interpretación de la ficha individual (RF-128). Pura.
 *
 * Contrato real (200): { codigo_participante, indicadores_adherencia:
 * { tasa_adherencia, dias_con_registro }, indicadores_progreso:
 * { nivel_progreso, unidades_completadas }, tendencia_consumo,
 * alertas_activas: [{ id_alerta, tipo_alerta, fecha_generacion,
 * estado_resolucion }], fecha_actualizacion, modo_consulta }.
 * `null` equivale al 204 (M05 no tiene perfil).
 *
 * 1. No hay campo de autorización: la autorización es la respuesta 200
 *    tras las guardas del backend. No se inventa ninguno.
 * 2. Aislamiento: si declara otro participante que el pedido, se bloquea
 *    entera (INCONSISTENT) y no se conserva ningún dato.
 * 3. `modo_consulta` debe ser SOLO_LECTURA; sin él la respuesta no es del
 *    contrato (INVALID).
 * 4. LISTA EXPLÍCITA de campos: todo lo demás (UUID internos, correo,
 *    nombre, textos clínicos) se descarta.
 *
 * Los indicadores se presentan tal como llegan: el nivel es una
 * categoría (nunca un porcentaje) y la adherencia una fracción entre 0 y
 * 1. Un indicador ausente (`null`) se muestra como no disponible, nunca
 * como 0. Un valor con un tipo distinto del contrato invalida la ficha.
 */
const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const isCount = (value) => Number.isInteger(value) && value >= 0;
const isFraction = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

class InvalidProfile extends Error {}

function optional(value, isValid) {
  if (value === null || value === undefined) return null;
  if (!isValid(value)) throw new InvalidProfile();

  return value;
}

function group(value) {
  if (!value || typeof value !== 'object') throw new InvalidProfile();

  return value;
}

function toAlert(alert) {
  if (!alert || typeof alert !== 'object') throw new InvalidProfile();

  return Object.freeze({
    id: text(alert.id_alerta),
    type: text(alert.tipo_alerta),
    generatedAt: text(alert.fecha_generacion),
    status: text(alert.estado_resolucion),
  });
}

function toProfile(data) {
  const adherence = group(data.indicadores_adherencia);
  const progress = group(data.indicadores_progreso);

  if (!Array.isArray(data.alertas_activas)) throw new InvalidProfile();

  return Object.freeze({
    progressLevel: optional(progress.nivel_progreso, (value) => typeof value === 'string' && value.trim() !== ''),
    completedUnits: optional(progress.unidades_completadas, isCount),
    adherence: optional(adherence.tasa_adherencia, isFraction),
    daysWithRecord: optional(adherence.dias_con_registro, isCount),
    trend: text(data.tendencia_consumo),
    activeAlerts: Object.freeze(data.alertas_activas.map(toAlert)),
    updatedAt: text(data.fecha_actualizacion),
  });
}

const inconsistent = Object.freeze({ outcome: PROFILE_OUTCOME.INCONSISTENT });
const invalid = Object.freeze({ outcome: PROFILE_OUTCOME.INVALID });

/*
 * `code` es el código pedido. En la API real es un seudónimo A7; en la
 * demostración, el código ficticio de la cohorte de prueba.
 */
export function interpretProfileResponse(data, { code }) {
  const requested = typeof code === 'string' ? code.trim().toUpperCase() : null;

  if (!requested) return invalid;

  if (data === null || data === undefined) {
    return Object.freeze({ outcome: PROFILE_OUTCOME.NO_PROFILE, code: requested, profile: null });
  }

  if (typeof data !== 'object') return invalid;

  const declared = typeof data.codigo_participante === 'string' ? data.codigo_participante.trim().toUpperCase() : null;
  if (!declared) return invalid;
  if (declared !== requested) return inconsistent;
  if (data.modo_consulta !== READ_ONLY_MODE) return invalid;

  try {
    return Object.freeze({ outcome: PROFILE_OUTCOME.OK, code: requested, profile: toProfile(data) });
  } catch (error) {
    if (error instanceof InvalidProfile) return invalid;
    throw error;
  }
}
