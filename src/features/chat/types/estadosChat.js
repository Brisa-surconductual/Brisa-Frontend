export const ESTADO_SESION = Object.freeze({
  ACTIVA: 'ACTIVA',
  PAUSADA: 'PAUSADA',
  COMPLETADA: 'COMPLETADA',
});

export const MODALIDAD = Object.freeze({
  GRUPAL: 'GRUPAL',
  PERSONALIZADA: 'PERSONALIZADA',
});

// Etapa 3, tarea 3: estado de cada interacción en `cola_interacciones`.
// ERROR_SINCRONIZACION marca la interacción que el servidor rechazó.
export const ESTADO_SINCRONIZACION = Object.freeze({
  PENDIENTE_SINCRONIZACION: 'PENDIENTE_SINCRONIZACION',
  ERROR_SINCRONIZACION: 'ERROR_SINCRONIZACION',
});

// Etapa 3, tarea 3: `estado_sesion_offline` de `sesiones_locales`.
// Ante el servidor: EN_CURSO e INTERRUMPIDA → ACTIVA; COMPLETADA →
// COMPLETADA (regla 5).
export const ESTADO_SESION_OFFLINE = Object.freeze({
  EN_CURSO: 'EN_CURSO',
  INTERRUMPIDA: 'INTERRUMPIDA',
  COMPLETADA: 'COMPLETADA',
});

// Etapa 3: `estado_conectividad` de cada interacción (RF-27 v1.1). No
// confundir con ESTADO_CONECTIVIDAD, del contrato anterior.
export const CONECTIVIDAD_INTERACCION = Object.freeze({
  EN_LINEA: 'EN_LINEA',
  SIN_CONEXION: 'SIN_CONEXION',
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
