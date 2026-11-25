import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import { PERMISSION_ERROR } from '../types/permissionScope.js';

/*
 * Permisos de acceso individual (HU-336). Contrato de la HU en Taiga,
 * pendiente de versionarse en el backend (A-075). Devuelve los datos tal
 * como llegan; los normaliza `data/individualPermissionSource.js`.
 */

const PERMISSIONS_PATH = '/admin/permisos-individuales';

// Rechazos esperados: los muestra la interfaz por `codigo` (sin `campo`).
const GRANT_REJECTIONS = new Map([
  [404, [PERMISSION_ERROR.PARTICIPANT_NOT_FOUND]],
  [409, [PERMISSION_ERROR.ALREADY_ACTIVE]],
  [422, [PERMISSION_ERROR.SELF_GRANT_FORBIDDEN]],
]);

const REVOKE_REJECTIONS = new Map([[409, [PERMISSION_ERROR.ALREADY_REVOKED]]]);

const isExpected = (rejections, { status, codigo }) =>
  Boolean(rejections.get(status)?.includes(codigo));

const rejection = ({ status, codigo, mensaje }) => ({
  ok: false,
  status,
  codigo,
  mensaje,
});

/*
 * Permisos vigentes del participante (`items` de la respuesta paginada), o
 * `null` si el participante no existe.
 * Solo lee la primera página (el `limit` por defecto del backend); con dos
 * alcances por titular no se llega a él. Paginar si el listado crece.
 */
export async function listPermissions(code) {
  let data;
  try {
    ({ data } = await apiClient.get(PERMISSIONS_PATH, {
      params: { codigo_participante: code, solo_vigentes: true },
    }));
  } catch (error) {
    const problem = toApiError(error);
    if (
      problem.status === 404 &&
      problem.codigo === PERMISSION_ERROR.PARTICIPANT_NOT_FOUND
    ) {
      return null;
    }
    throw problem;
  }
  if (!Array.isArray(data?.items))
    throw new Error('El listado de permisos no es válido.');
  return data.items;
}

// `request` = `{ codigo_participante, alcance, fecha_fin_vigencia }` (toGrantRequest).
export async function grantPermission(request) {
  try {
    const { data } = await apiClient.post(PERMISSIONS_PATH, request);
    return { ok: true, data };
  } catch (error) {
    const problem = toApiError(error);
    if (isExpected(GRANT_REJECTIONS, problem)) return rejection(problem);
    throw problem;
  }
}

export async function revokePermission(permissionId) {
  try {
    await apiClient.post(
      `${PERMISSIONS_PATH}/${encodeURIComponent(permissionId)}/revocar`,
      {},
    );
    return { ok: true };
  } catch (error) {
    const problem = toApiError(error);
    if (isExpected(REVOKE_REJECTIONS, problem)) return rejection(problem);
    throw problem;
  }
}
