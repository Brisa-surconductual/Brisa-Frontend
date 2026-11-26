import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import { AUDIT_QUERY_ERROR } from '../types/auditSource.js';

export async function fetchAuditRecords({ cursor = null, signal } = {}) {
  let response;
  try {
    response = await apiClient.get('/administrativo/auditoria', {
      params: cursor ? { antes_de: cursor } : undefined,
      signal,
    });
  } catch (error) {
    const apiError = toApiError(error);
    const code = apiError.status === 403
      ? AUDIT_QUERY_ERROR.ACCESS_DENIED
      : apiError.status === 401
        ? AUDIT_QUERY_ERROR.SESSION_EXPIRED
        : apiError.codigo;
    throw Object.assign(new Error('No se pudo consultar la bitácora.'), { code });
  }

  const { data, meta } = response.data ?? {};
  if (!Array.isArray(data) || typeof meta?.hay_mas !== 'boolean'
    || (meta.hay_mas && (typeof meta.siguiente_cursor !== 'string'
      || !meta.siguiente_cursor || meta.siguiente_cursor === cursor))) {
    throw new Error('La bitácora devolvió una página inválida.');
  }

  return {
    records: data.map((row) => ({
      id: row.id_auditoria,
      action: row.accion,
      resource: row.recurso_afectado,
      timestamp: row.marca_temporal,
      status: row.estado_accion,
    })),
    nextCursor: meta.hay_mas ? meta.siguiente_cursor : null,
  };
}
