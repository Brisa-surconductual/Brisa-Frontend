import * as permissionsApi from '../api/individualPermissionsApi.js';
import {
  normalizePermiso,
  normalizePermissionList,
} from '../services/individualPermission.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Fuente de los permisos de acceso individual (HU-336): demostración o API
 * según `isCohortDemoEnabled()`. Normaliza en un solo sitio lo que llega
 * de cualquiera de las dos.
 */

async function loadDemo() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error('La demostración de permisos está desactivada.');
  }
  return import('./individualPermissionDemoSource.js');
}

const backend = async () =>
  isCohortDemoEnabled() ? loadDemo() : permissionsApi;

// `null` si el participante no existe; si no, `{ permissions, discarded }`.
export async function listPermissions(code) {
  const rows = await (await backend()).listPermissions(code);
  return rows === null ? null : normalizePermissionList(rows);
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
