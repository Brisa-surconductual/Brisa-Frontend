export const ESTADO_SESION = Object.freeze({
  ACTIVA: 'ACTIVA',
  PAUSADA: 'PAUSADA',
  COMPLETADA: 'COMPLETADA',
});

export const MODALIDAD = Object.freeze({
  GRUPAL: 'GRUPAL',
  PERSONALIZADA: 'PERSONALIZADA',
});

// Contrato 7.1: estado de cada interacción en la cola local sin conexión.
export const ESTADO_SINCRONIZACION = Object.freeze({
  PENDIENTE_SINCRONIZACION: 'PENDIENTE_SINCRONIZACION',
});

// Contrato 7.2: estado que devuelve el servidor por cada interacción del lote.
export const RESULTADO_SINCRONIZACION = Object.freeze({
  SINCRONIZADO: 'SINCRONIZADO',
  DUPLICADO: 'DUPLICADO',
  ERROR: 'ERROR',
  PENDIENTE: 'PENDIENTE',
});

// Contrato 7.2: DUPLICADO se trata como sincronizado.
export const RESULTADO_SINCRONIZACION_EXITOSO = Object.freeze([
  RESULTADO_SINCRONIZACION.SINCRONIZADO,
  RESULTADO_SINCRONIZACION.DUPLICADO,
]);

export const ESTADO_PRECARGA = Object.freeze({
  COMPLETA: 'COMPLETA',
  PARCIAL: 'PARCIAL',
  FALLIDA: 'FALLIDA',
});

export const ESTADO_CONECTIVIDAD = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
});

export const EMISOR = Object.freeze({
  AVATAR: 'AVATAR',
  SISTEMA: 'SISTEMA',
});

export const TIPO_RECURSO = Object.freeze({
  IMAGEN: 'IMAGEN',
  VIDEO: 'VIDEO',
  GIF: 'GIF',
});
