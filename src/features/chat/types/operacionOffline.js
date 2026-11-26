// Etapa 3, tarea 3 (RF-34): operación del chat sin conexión.

// Por qué la conversación sin conexión no puede continuar.
export const BLOQUEO_OFFLINE = Object.freeze({
  // No hay paquete (o sesión local) del usuario en el dispositivo.
  SIN_PAQUETE: 'SIN_PAQUETE',
  // El nodo actual o el destino no están en el paquete.
  NODO_AUSENTE: 'NODO_AUSENTE',
  // La validación o la transición usan una regla cuya semántica no está
  // definida en el contrato de la Etapa 3: no se acepta la respuesta.
  REGLA_NO_SOPORTADA: 'REGLA_NO_SOPORTADA',
  // Ninguna transición se cumple (en el servidor, SIN_TRANSICION).
  SIN_TRANSICION: 'SIN_TRANSICION',
  // La sesión local no conoce su última secuencia: no se inventa.
  SECUENCIA_NO_DETERMINADA: 'SECUENCIA_NO_DETERMINADA',
  // IndexedDB no está disponible en el navegador.
  ALMACENAMIENTO_NO_DISPONIBLE: 'ALMACENAMIENTO_NO_DISPONIBLE',
});

// Textos de la tabla de RF-34 (documento de la Etapa 3), tal cual.
export const MENSAJE_RF34 = Object.freeze({
  SIN_PAQUETE:
    'No es posible continuar sin conexión porque el contenido de la sesión no está disponible en el dispositivo.',
  NODO_AUSENTE:
    'No es posible continuar la sesión sin conexión porque falta contenido necesario.',
  RECURSO_SIN_CACHE:
    'Parte del contenido multimedia no está disponible sin conexión. Puede continuar con la información de texto disponible.',
  FALLO_ESCRITURA:
    'No fue posible guardar la interacción en el dispositivo. Intente nuevamente.',
  REAPERTURA: 'La sesión será retomada desde el último punto guardado.',
});

// Textos de interfaz para los casos que la tabla de RF-34 no cubre.
export const MENSAJE_BLOQUEO = Object.freeze({
  [BLOQUEO_OFFLINE.SIN_PAQUETE]: MENSAJE_RF34.SIN_PAQUETE,
  [BLOQUEO_OFFLINE.NODO_AUSENTE]: MENSAJE_RF34.NODO_AUSENTE,
  [BLOQUEO_OFFLINE.REGLA_NO_SOPORTADA]:
    'Esta pregunta no se puede responder sin conexión: sus reglas de validación no se pueden aplicar en el dispositivo.',
  // Mismo texto que el servidor para SIN_TRANSICION.
  [BLOQUEO_OFFLINE.SIN_TRANSICION]:
    'No se pudo determinar la siguiente acción en la conversación.',
  [BLOQUEO_OFFLINE.SECUENCIA_NO_DETERMINADA]:
    'No es posible continuar sin conexión porque no se conoce el último punto registrado de la sesión.',
  [BLOQUEO_OFFLINE.ALMACENAMIENTO_NO_DISPONIBLE]:
    'Este navegador no permite guardar la conversación en el dispositivo.',
});

// Operadores de transición con semántica definida en el contrato 5a.
export const OPERADOR_OFFLINE = Object.freeze({
  ENTRE: 'ENTRE',
  SIEMPRE: 'SIEMPRE',
});

// Tipos de dato de `validacion` con semántica definida en el contrato 5a.
export const TIPO_DATO_OFFLINE = Object.freeze({
  ENTERO: 'ENTERO',
});
