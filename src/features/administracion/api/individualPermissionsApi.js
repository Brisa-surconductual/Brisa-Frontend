import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import { PERMISSION_ERROR } from '../types/permissionScope.js';

/*
 * Permisos de acceso individual (HU-336). Contrato = código del PR #87 del
 * backend (D22), pendiente de versionarse (A-075). Devuelve los datos tal
 * como llegan; los normaliza `data/individualPermissionSource.js`.
 */

const PERMISSIONS_PATH = '/admin/permisos-individuales';

// Rechazos esperados: los muestra la interfaz por `codigo` (sin `campo`).
const GRANT_REJECTIONS = new Map([
  [404, [PERMISSION_ERROR.PARTICIPANT_NOT_FOUND]],
  [409, [PERMISSION_ERROR.ALREADY_ACTIVE]],
  [
    422,
    [
      PERMISSION_ERROR.SELF_GRANT_FORBIDDEN,
      PERMISSION_ERROR.INVALID_ROLE,
      PERMISSION_ERROR.INVALID_VALIDITY,
    ],
  ],
]);

const REVOKE_REJECTIONS = new Map([
  [404, [PERMISSION_ERROR.NOT_FOUND]],
  [409, [PERMISSION_ERROR.ALREADY_REVOKED]],
]);

const isExpected = (rejections, { status, codigo }) =>
  Boolean(rejections.get(status)?.includes(codigo));

const rejection = ({ status, codigo, mensaje }) => ({
  ok: false,
  status,
  codigo,
  mensaje,
});

// Mismo valor que el `limit` por defecto del backend (máximo 100: D27).
export const PERMISSIONS_PAGE_SIZE = 20;

const isCount = (value, min) => Number.isInteger(value) && value >= min;

/*
 * Una página de permisos vigentes: `{ items, total, offset, limit }`. Con un
 * código desconocido el backend responde 200 con `items: []`, no 404.
 */
export async function listPermissions(
  code,
  { offset = 0, limit = PERMISSIONS_PAGE_SIZE } = {},
) {
  let data;
  try {
    ({ data } = await apiClient.get(PERMISSIONS_PATH, {
      params: {
        codigo_participante: code,
        solo_vigentes: true,
        offset,
        limit,
      },
    }));
  } catch (error) {
    throw toApiError(error);
  }
  if (
    !Array.isArray(data?.items) ||
    !isCount(data.total, 0) ||
    !isCount(data.offset, 0) ||
    !isCount(data.limit, 1)
  )
    throw new Error('El listado de permisos no es válido.');
  return {
    items: data.items,
    total: data.total,
    offset: data.offset,
    limit: data.limit,
  };
}

// `request` sale de `toGrantRequest` (incluye `id_usuario_beneficiario`).
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
