// Etapa 3, tarea 4: sincronización de interacciones diferidas.

// `codigo` de error del endpoint de sincronización (tabla de la tarea 4).
// Los fallos de red usan CHAT_CLIENT_ERROR.SIN_CONEXION, como en línea.
export const CODIGO_SINCRONIZACION = Object.freeze({
  LOTE_INVALIDO: 'LOTE_INVALIDO',
  NO_AUTENTICADO: 'NO_AUTENTICADO',
  CSRF_INVALIDO: 'CSRF_INVALIDO',
  SESION_NO_ENCONTRADA: 'SESION_NO_ENCONTRADA',
  ERROR_SINCRONIZACION: 'ERROR_SINCRONIZACION',
});

// Estado de sincronización de una sesión, visto desde el dispositivo.
export const ESTADO_SINCRONIZACION_SESION = Object.freeze({
  // Sin interacciones en la cola.
  AL_DIA: 'AL_DIA',
  // Hay pendientes y nada impide enviarlas.
  PENDIENTE: 'PENDIENTE',
  SINCRONIZANDO: 'SINCRONIZANDO',
  // Fallo transitorio (500, confirmación parcial): espera el backoff.
  REINTENTO_PROGRAMADO: 'REINTENTO_PROGRAMADO',
  // Se perdió la red con el lote en curso; se reintenta con backoff.
  INTERRUMPIDA: 'INTERRUMPIDA',
  // Se agotaron los reintentos automáticos; espera conexión, login o
  // una solicitud manual.
  REINTENTOS_AGOTADOS: 'REINTENTOS_AGOTADOS',
  ESPERANDO_CONEXION: 'ESPERANDO_CONEXION',
  // 401: la cola se conserva hasta un nuevo inicio de sesión (D5).
  ESPERANDO_AUTENTICACION: 'ESPERANDO_AUTENTICACION',
  // Hay interacciones en ERROR_SINCRONIZACION (rechazo o 404): no hay
  // reintentos automáticos y la política de recuperación no está definida.
  PENDIENTE_DE_RESOLUCION: 'PENDIENTE_DE_RESOLUCION',
  // 400: el mismo lote no se reintenta automáticamente.
  LOTE_INVALIDO: 'LOTE_INVALIDO',
  // 200 con un cuerpo incompleto o incoherente: no se borra nada.
  RESPUESTA_NO_VERIFICABLE: 'RESPUESTA_NO_VERIFICABLE',
  // La sesión local no conoce su última secuencia: no se inventa.
  SECUENCIA_NO_DETERMINADA: 'SECUENCIA_NO_DETERMINADA',
  // La cola local tiene huecos o secuencias imposibles.
  SECUENCIA_INCONSISTENTE: 'SECUENCIA_INCONSISTENTE',
});

// Qué disparó un intento (tarea 4, «Cuándo sincroniza»).
export const MOTIVO_SINCRONIZACION = Object.freeze({
  INICIO_SESION: 'INICIO_SESION',
  CONEXION: 'CONEXION',
  FOCO: 'FOCO',
  PERIODICO: 'PERIODICO',
  REINTENTO: 'REINTENTO',
  MANUAL: 'MANUAL',
});

// Valores por defecto; el coordinador los acepta como configuración.
export const CONFIG_SINCRONIZACION = Object.freeze({
  tamanoMaximoLote: 100,
  esperaInicialMs: 2_000,
  esperaMaximaMs: 300_000,
  intervaloMs: 60_000,
  // Tope de reintentos automáticos seguidos de una sesión.
  maxReintentos: 8,
});

// Textos para el estudiante. Los dos primeros son los de RF-34 y de la
// tabla de la tarea 4, tal cual.
export const MENSAJE_SINCRONIZACION = Object.freeze({
  CONEXION_RESTABLECIDA:
    'La conexión se ha restablecido. Las interacciones pendientes serán sincronizadas automáticamente.',
  INTERRUMPIDA:
    'La sincronización fue interrumpida. Los datos pendientes se sincronizarán cuando se restablezca la conexión.',
  AL_DIA: 'Todas tus respuestas están sincronizadas.',
  PENDIENTE: 'Tus respuestas pendientes se sincronizarán automáticamente.',
  SINCRONIZANDO: 'Sincronizando tus respuestas.',
  REINTENTO_PROGRAMADO:
    'No fue posible completar la sincronización. Se reintentará automáticamente.',
  REINTENTOS_AGOTADOS:
    'Se pausaron los reintentos automáticos. Se intentará de nuevo cuando vuelva la conexión.',
  ESPERANDO_CONEXION:
    'Sin conexión. La sincronización se hará cuando vuelva la conexión.',
  ESPERANDO_AUTENTICACION:
    'Tu sesión expiró. Las respuestas se conservan y se sincronizarán cuando vuelvas a iniciar sesión.',
  PENDIENTE_DE_RESOLUCION:
    'Una respuesta no fue aceptada. La sincronización de esta sesión se detuvo y queda pendiente de resolución.',
  LOTE_INVALIDO:
    'No fue posible preparar el envío de estas respuestas. No se reintentará automáticamente.',
  RESPUESTA_NO_VERIFICABLE:
    'No fue posible verificar la confirmación recibida. Tus respuestas se conservan en el dispositivo.',
  SECUENCIA_NO_DETERMINADA:
    'No es posible sincronizar esta sesión porque no se conoce el orden de sus respuestas.',
  SECUENCIA_INCONSISTENTE:
    'No es posible sincronizar esta sesión porque el orden de sus respuestas guardadas no es válido.',
  DISCREPANCIA_NODO:
    'El punto de avance confirmado no coincide con el del dispositivo. Se conserva el avance del dispositivo.',
});
