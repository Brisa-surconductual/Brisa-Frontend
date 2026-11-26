import * as permissionsApi from '../api/individualPermissionsApi.js';
import {
  normalizeBeneficiaryList,
  normalizePermiso,
  normalizePermissionList,
} from '../services/individualPermission.js';
import { PERMISSION_ERROR } from '../types/permissionScope.js';
import { normalizeParticipantCode } from '../services/chatTraceabilityIds.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Fuente de los permisos de acceso individual (HU-336): demostración o API
 * según `isCohortDemoEnabled()`. Normaliza en un solo sitio lo que llega
 * de cualquiera de las dos.
 */

const PAGE_SIZE = permissionsApi.PERMISSIONS_PAGE_SIZE;
const MAX_PAGE_SIZE = 100;

async function loadDemo() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error('La demostración de permisos está desactivada.');
  }
  return import('./individualPermissionDemoSource.js');
}

const backend = async () =>
  isCohortDemoEnabled() ? loadDemo() : permissionsApi;

// D30: lo que el backend rechazaría con 400 (o contestaría para todos) no sale del cliente.
function assertValidPage({ offset = 0, limit = PAGE_SIZE } = {}) {
  if (!Number.isInteger(offset) || offset < 0)
    throw new Error('Desplazamiento no válido.');
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE)
    throw new Error('Tamaño de página no válido.');
}

function assertValidQuery(code, page) {
  if (normalizeParticipantCode(code) === null)
    throw new Error('Código de participante no válido.');
  assertValidPage(page);
}

const isUnknownParticipant = (error) =>
  error?.status === 404 &&
  error?.codigo === PERMISSION_ERROR.PARTICIPANT_NOT_FOUND;

// Una página: `{ permissions, discarded, total, offset, limit }` (D25), o `null` si el
// participante no existe (404 del backend, D38). Los demás errores se relanzan.
export async function listPermissions(code, page) {
  assertValidQuery(code, page);
  let raw;
  try {
    raw = await (await backend()).listPermissions(code, page);
  } catch (error) {
    if (isUnknownParticipant(error)) return null;
    throw error;
  }
  const { items, ...paging } = raw;
  return { ...normalizePermissionList(items), ...paging };
}

// Administrativos que se pueden elegir como beneficiarios (D37):
// `{ beneficiaries, discarded, total, offset, limit }`.
export async function listBeneficiaries(page) {
  assertValidPage(page);
  const { items, ...paging } = await (await backend()).listBeneficiaries(page);
  return { ...normalizeBeneficiaryList(items), ...paging };
}

// `request` sale de `toGrantRequest`. `{ ok: true, permission }` o el rechazo esperado.
export async function grantPermission(request) {
  const result = await (await backend()).grantPermission(request);
  return result.ok
    ? { ok: true, permission: toPermissionOrNull(result.data) }
    : result;
}

/*
 * El 201 ya concedió el permiso en el servidor: si su cuerpo no se puede
 * normalizar no se informa como fallo (el reintento daría 409), sino con
 * `permission: null` para que la interfaz recargue la lista.
 */
function toPermissionOrNull(data) {
  try {
    return normalizePermiso(data);
  } catch {
    return null;
  }
}

export async function revokePermission(permissionId) {
  return (await backend()).revokePermission(permissionId);
}
