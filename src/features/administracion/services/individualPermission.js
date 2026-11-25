import {
  getCurrentDateInBogota,
  parseDateOnly,
} from '@/shared/utils/dateUtils.js';

import {
  PERMISSION_ERROR,
  PERMISSION_SCOPE,
} from '../types/permissionScope.js';
import {
  getPermissionErrorMessage,
  PERMISSION_FORM_MESSAGE,
} from '../utils/individualPermissionMessages.js';

/*
 * Permisos de acceso individual (HU-336). Funciones puras: normalizan la
 * respuesta del contrato de Taiga (A-075), validan el formulario, arman la
 * petición y ubican por `codigo` los errores de la concesión.
 */

const SCOPES = Object.values(PERMISSION_SCOPE);

// America/Bogota no tiene horario de verano: siempre UTC-5.
const BOGOTA_OFFSET = '-05:00';

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isInstant = (value) => isText(value) && !Number.isNaN(Date.parse(value));

function instant(value, name) {
  if (!isInstant(value)) throw new Error(`Permiso con ${name} inválido.`);
  return value;
}

const optionalInstant = (value, name) =>
  value === null || value === undefined ? null : instant(value, name);

function holder(value) {
  if (value === null || value === undefined) return null;
  if (!isText(value.id) || !isText(value.nombre))
    throw new Error('Permiso con titular inválido.');
  return Object.freeze({ id: value.id, name: value.nombre });
}

/*
 * D20: la API manda `fecha_fin_vigencia` como instante; la interfaz muestra
 * la fecha de ese instante en America/Bogota. Cortar el ISO (`slice(0, 10)`)
 * daría el día siguiente: `2026-12-02T04:59:59Z` es el 1 de diciembre en Bogotá.
 */
const bogotaDate = (value) =>
  value === null ? null : getCurrentDateInBogota(new Date(value));

// Un elemento del backend (snake_case) → permiso de la interfaz. Lanza si no vale.
export function normalizePermiso(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Permiso vacío.');
  if (!isText(raw.id_permiso)) throw new Error('Permiso sin id_permiso.');
  if (!SCOPES.includes(raw.alcance))
    throw new Error('Permiso con alcance desconocido.');
  if (typeof raw.vigente !== 'boolean') throw new Error('Permiso sin vigente.');

  const endsAt = optionalInstant(raw.fecha_fin_vigencia, 'fecha_fin_vigencia');

  return Object.freeze({
    id: raw.id_permiso,
    scope: raw.alcance,
    active: raw.vigente,
    startsAt: instant(raw.fecha_inicio_vigencia, 'fecha_inicio_vigencia'),
    endsAt,
    endDate: bogotaDate(endsAt),
    // D21: opcionales en el contrato de Taiga.
    grantedAt: optionalInstant(raw.otorgado_en, 'otorgado_en'),
    holder: holder(raw.titular),
  });
}

/*
 * Normaliza la lista sin romperla: los elementos inválidos se cuentan
 * aparte. Una lista con todo descartado NO es una lista vacía: la interfaz
 * avisa de `discarded` y no muestra «sin permisos». Lo que no es lista se
 * rechaza para no confundirlo con «sin permisos».
 */
export function normalizePermissionList(rows) {
  if (!Array.isArray(rows))
    throw new Error('El listado de permisos no es válido.');

  const permissions = [];
  let discarded = 0;

  for (const row of rows) {
    try {
      permissions.push(normalizePermiso(row));
    } catch {
      discarded += 1;
    }
  }

  return Object.freeze({ permissions: Object.freeze(permissions), discarded });
}

// Validación del cliente antes de enviar. `tomorrow` es `YYYY-MM-DD` en Bogotá.
export function validatePermissionForm({ scope, endDate }, tomorrow) {
  const errors = {};

  if (!SCOPES.includes(scope))
    errors.scope = PERMISSION_FORM_MESSAGE.SCOPE_REQUIRED;

  if (endDate) {
    if (parseDateOnly(endDate) === null) {
      errors.endDate = PERMISSION_FORM_MESSAGE.END_DATE_INVALID;
    } else if (endDate < tomorrow) {
      errors.endDate = PERMISSION_FORM_MESSAGE.END_DATE_TOO_EARLY;
    }
  }

  return errors;
}

/*
 * D20: el permiso vale hasta el final del día elegido en Bogotá, así que se
 * envía `YYYY-MM-DDT23:59:59-05:00` en ISO (UTC). PENDIENTE (A-075): Leandro
 * confirma si el backend espera este instante o `23:59:59Z`.
 */
export const endOfDayInBogota = (date) =>
  new Date(`${date}T23:59:59${BOGOTA_OFFSET}`).toISOString();

export const toGrantRequest = (participantCode, { scope, endDate }) => ({
  codigo_participante: participantCode,
  alcance: scope,
  fecha_fin_vigencia: endDate ? endOfDayInBogota(endDate) : null,
});

// D19: el sobre no trae `campo`; el error se ubica por `codigo`.
const FIELD_BY_CODE = Object.freeze({
  [PERMISSION_ERROR.ALREADY_ACTIVE]: 'scope',
});

/*
 * El error de la concesión va junto al campo que le corresponde por su
 * `codigo`; la autoconcesión y lo no reconocido, al aviso general
 * (`field: null`). El `mensaje` del backend se muestra tal cual; el texto
 * propio solo cubre su ausencia.
 */
export function readGrantError(error) {
  return Object.freeze({
    field: FIELD_BY_CODE[error?.codigo] ?? null,
    message: isText(error?.mensaje)
      ? error.mensaje
      : getPermissionErrorMessage(error?.codigo),
  });
}
