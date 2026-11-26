import { ESTADO_RENDER, MIME_PERMITIDOS } from '../types/index.js';

// El backend solo entrega URL https (firmadas o públicas); cualquier otra
// se trata como recurso no disponible.
export function esUrlSegura(url) {
  if (typeof url !== 'string') return false;

  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

// Solo para IMAGEN, GIF y VIDEO: un tipo sin lista da no soportado.
// A-040: sin `mimeType` (o vacío tras normalizar) no se bloquea. Un valor
// que no es texto llega del backend fuera de contrato: no soportado.
function esMimePermitido({ tipo, mimeType }) {
  if (mimeType == null) return true;
  if (typeof mimeType !== 'string') return false;

  const mime = mimeType.split(';')[0].trim().toLowerCase();

  if (!mime) return true;

  return MIME_PERMITIDOS[tipo]?.includes(mime) ?? false;
}

// RF-33 (D8): se calcula en cada render. `noDisponible` lo marca el
// reducer cuando ya no queda recarga (A-017) y gana sobre el estado local,
// porque con la misma URL el medio no se vuelve a montar.
export function resolverEstadoRender(bloque, estadoLocal) {
  if (bloque.noDisponible || !esUrlSegura(bloque.url)) {
    return ESTADO_RENDER.ERROR_CARGA;
  }

  if (!esMimePermitido(bloque)) return ESTADO_RENDER.NO_SOPORTADO;

  return estadoLocal;
}
