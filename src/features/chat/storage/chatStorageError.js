// Errores del almacenamiento local del chat (base `brisa-chat`). Son del
// cliente, no del backend: se distinguen por `code`, como los de la API.
export const CHAT_STORAGE_ERROR = Object.freeze({
  // IndexedDB no existe o el navegador no permite abrir la base.
  ALMACENAMIENTO_NO_DISPONIBLE: 'ALMACENAMIENTO_NO_DISPONIBLE',
  // El registro a guardar no cumple el contrato del almacén.
  DATOS_INVALIDOS: 'DATOS_INVALIDOS',
  // La sesión local no existe en el dispositivo.
  SESION_LOCAL_NO_ENCONTRADA: 'SESION_LOCAL_NO_ENCONTRADA',
  // El registro pertenece a otro usuario.
  USUARIO_NO_CORRESPONDE: 'USUARIO_NO_CORRESPONDE',
  // No se conoce la última secuencia confirmada de la sesión: no se
  // inventa una (bloqueante de E3-B2).
  SECUENCIA_NO_DETERMINADA: 'SECUENCIA_NO_DETERMINADA',
  // La sesión local ya está completada: no admite más interacciones.
  SESION_LOCAL_COMPLETADA: 'SESION_LOCAL_COMPLETADA',
  // Otra interacción ya ocupa la clave o la secuencia (índice único).
  INTERACCION_EN_CONFLICTO: 'INTERACCION_EN_CONFLICTO',
  // La transacción no se completó; nada quedó guardado.
  ESCRITURA_FALLIDA: 'ESCRITURA_FALLIDA',
});

export function createChatStorageError(code, cause) {
  const error = new Error(code);
  error.name = 'ChatStorageError';
  error.code = code;
  if (cause !== undefined) error.cause = cause;
  return error;
}

export const esChatStorageError = (error) => error?.name === 'ChatStorageError';
