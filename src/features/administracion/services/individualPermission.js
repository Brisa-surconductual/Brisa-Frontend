import { API_ERROR_CLIENTE } from '@/shared/utils/apiError.js';
import {
  getCurrentDateInBogota,
  parseDateOnly,
} from '@/shared/utils/dateUtils.js';

import { isUuid } from './chatTraceabilityIds.js';
import {
  PERMISSION_ERROR,
  PERMISSION_SCOPE,
} from '../types/permissionScope.js';
import { parseAuditTimestamp } from '../utils/formatAuditTimestamp.js';
import {
  getPermissionErrorMessage,
  PERMISSION_FORM_MESSAGE,
} from '../utils/individualPermissionMessages.js';

/*
 * Permisos de acceso individual (HU-336). Funciones puras: normalizan la
 * respuesta del backend (PR #87, D22), validan el formulario, arman la
 * petición y ubican por `codigo` los errores de la concesión.
 */

const SCOPES = Object.values(PERMISSION_SCOPE);

// America/Bogota no tiene horario de verano: siempre UTC-5.
const BOGOTA_OFFSET = '-05:00';

const isText = (value) => typeof value === 'string' && value.trim() !== '';
// D31: ISO 8601 con zona explícita (un `Date.parse` suelto acepta cadenas como 2026).
const isInstant = (value) => parseAuditTimestamp(value) !== null;

function instant(value, name) {
  if (!isInstant(value)) throw new Error(`Permiso con ${name} inválido.`);
  return value;
}

const optionalInstant = (value, name) =>
  value === null || value === undefined ? null : instant(value, name);

// El 201 de la concesión no trae el beneficiario; el GET sí (D23).
function beneficiary(value) {
  if (value === null || value === undefined) return null;
  if (!isUuid(value)) throw new Error('Permiso con beneficiario inválido.');
  return value;
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
  // D27: un id que no es UUID daría 400 al revocar; se descarta aquí.
  if (!isUuid(raw.id_permiso))
    throw new Error('Permiso sin id_permiso válido.');
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
    revokedAt: optionalInstant(raw.revocado_en, 'revocado_en'),
    beneficiaryId: beneficiary(raw.id_usuario_beneficiario),
    // D36: la etiqueta del beneficiario es su correo (la base no tiene nombre; A-076).
    beneficiaryEmail: isText(raw.correo_beneficiario)
      ? raw.correo_beneficiario
      : null,
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
      const permission = normalizePermiso(row);
      // D29: se pidieron solo los vigentes; uno que no lo es no se muestra.
      if (!permission.active) {
        discarded += 1;
        continue;
      }
      permissions.push(permission);
    } catch {
      discarded += 1;
    }
  }

  return Object.freeze({ permissions: Object.freeze(permissions), discarded });
}

// Un elemento de `GET .../beneficiarios` → `{ id, email }` (D37). El id sale en minúsculas:
// el backend compara la autoconcesión distinguiendo mayúsculas.
export function normalizeBeneficiary(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Beneficiario vacío.');
  if (!isUuid(raw.id_usuario))
    throw new Error('Beneficiario sin id_usuario válido.');
  if (!isText(raw.correo_electronico))
    throw new Error('Beneficiario sin correo.');
  return Object.freeze({
    id: raw.id_usuario.toLowerCase(),
    email: raw.correo_electronico,
  });
}

// Igual que `normalizePermissionList`: lo inválido se descarta y se cuenta.
export function normalizeBeneficiaryList(rows) {
  if (!Array.isArray(rows))
    throw new Error('El listado de beneficiarios no es válido.');

  const beneficiaries = [];
  let discarded = 0;

  for (const row of rows) {
    try {
      beneficiaries.push(normalizeBeneficiary(row));
    } catch {
      discarded += 1;
    }
  }

  return Object.freeze({
    beneficiaries: Object.freeze(beneficiaries),
    discarded,
  });
}

// Validación del cliente antes de enviar. `tomorrow` es `YYYY-MM-DD` en Bogotá.
export function validatePermissionForm(
  { scope, endDate, beneficiaryId },
  tomorrow,
) {
  const errors = {};

  if (!isUuid(beneficiaryId))
    errors.beneficiaryId = PERMISSION_FORM_MESSAGE.BENEFICIARY_REQUIRED;

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
 * envía `YYYY-MM-DDT23:59:59-05:00` en ISO (UTC). Confirmado por el backend
 * (2026-11-25): la zona es la de Bogotá.
 */
export const endOfDayInBogota = (date) =>
  new Date(`${date}T23:59:59${BOGOTA_OFFSET}`).toISOString();

// `id_usuario_beneficiario` no es la identidad de quien pide (sale de la sesión): D23.
export const toGrantRequest = (
  participantCode,
  { scope, endDate, beneficiaryId },
) => ({
  codigo_participante: participantCode,
  alcance: scope,
  fecha_fin_vigencia: endDate ? endOfDayInBogota(endDate) : null,
  id_usuario_beneficiario: beneficiaryId,
});

// D24: el sobre no trae `campo`; el error se ubica por `codigo`.
const FIELD_BY_CODE = Object.freeze({
  [PERMISSION_ERROR.ALREADY_ACTIVE]: 'scope',
  [PERMISSION_ERROR.INVALID_VALIDITY]: 'endDate',
  [PERMISSION_ERROR.SELF_GRANT_FORBIDDEN]: 'beneficiaryId',
  [PERMISSION_ERROR.INVALID_ROLE]: 'beneficiaryId',
});

/*
 * El error de la concesión va junto al campo que le corresponde por su
 * `codigo`; lo demás, al aviso general (`field: null`). El `mensaje` del backend se muestra tal cual; el texto
 * propio solo cubre su ausencia.
 */
export function readGrantError(error) {
  return Object.freeze({
    field: FIELD_BY_CODE[error?.codigo] ?? null,
    message: readPermissionErrorMessage(error),
  });
}

// D28: el `mensaje` del backend solo se muestra si el sobre trae `codigo` (no en un 400 de
// Nest ni en las guardas); si no, el texto de respaldo del código.
export function readPermissionErrorMessage(error) {
  return isText(error?.mensaje) &&
    error?.codigo !== API_ERROR_CLIENTE.DESCONOCIDO
    ? error.mensaje
    : getPermissionErrorMessage(error?.codigo);
}
