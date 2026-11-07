// RF-25: ciclo de vida de un flujo conversacional (enum del backend).
export const ESTADO_FLUJO = Object.freeze({
  BORRADOR: 'BORRADOR',
  PUBLICADO: 'PUBLICADO',
  ARCHIVADO: 'ARCHIVADO',
});

export const ESTADO_FLUJO_ETIQUETA = Object.freeze({
  [ESTADO_FLUJO.BORRADOR]: 'Borrador',
  [ESTADO_FLUJO.PUBLICADO]: 'Publicado',
  [ESTADO_FLUJO.ARCHIVADO]: 'Archivado',
});

// Mismo límite que valida el backend para `nombre`.
export const NOMBRE_FLUJO_MAX = 150;
