import { ESTADO_RENDER, MIME_PERMITIDOS } from '../types/index.js';

// El backend solo entrega URL https (firmadas o públicas); cualquier otra
// se trata como recurso no disponible.
export function esUrlSegura(url) {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

// A-040: `mimeType` puede llegar null; entonces no se bloquea.
function esMimePermitido({ tipo, mimeType }) {
  if (!mimeType) return true;

  const mime = mimeType.split(';')[0].trim().toLowerCase();

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
