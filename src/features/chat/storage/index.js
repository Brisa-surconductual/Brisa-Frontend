// Almacenamiento local del chat (base `brisa-chat` v1). Superficie
// pública: fuera de esta carpeta se importa desde aquí.

// Esquema y errores
export { ALMACEN, BRISA_CHAT_DB, INDICE_COLA } from './brisaChatDb.js';
export { CHAT_STORAGE_ERROR, esChatStorageError } from './chatStorageError.js';

// Paquetes y recursos: interfaz compartida con la precarga (tarea 2)
export {
  guardarPaquete,
  obtenerEtagPaquete,
  obtenerPaquete,
} from './paquetesStore.js';
export { guardarRecurso, obtenerRecurso } from './recursosStore.js';

// Sesiones locales y cola de interacciones (tareas 3 y 4)
export {
  actualizarSesionLocal,
  guardarSesionLocal,
  listarSesionesLocales,
  obtenerSesionLocal,
} from './sesionesLocalesStore.js';
export {
  actualizarEstadoSincronizacion,
  eliminarInteraccionesConfirmadas,
  encolarInteraccion,
  listarColaSesion,
  listarPendientesSesion,
  listarSesionesConPendientes,
  tienePendientes,
} from './colaInteraccionesStore.js';

// Cierre de sesión (regla 4, D5)
export { limpiarDatosOfflineAlCerrarSesion } from './limpiezaCierreSesion.js';
