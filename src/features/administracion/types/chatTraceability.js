/*
 * Trazabilidad administrativa de sesiones conversacionales (RF-38, M03
 * consumido por M08). Valores del contrato del backend
 * (Brisa-Backend, docs/CONTRATO_HU_TRAZABILIDAD_SESION.md, PR #74). Los
 * textos son de la interfaz; los valores, del backend.
 */

// Seudónimo A7 del participante: `P-` y 8 hexadecimales en mayúscula.
export const PARTICIPANT_CODE_PATTERN = /^P-[0-9A-F]{8}$/;

// Página del listado: el contrato admite de 1 a 50; por defecto 20.
export const SESSIONS_PAGE_SIZE = 20;

export const SESSION_STATE = Object.freeze({
  ACTIVA: 'ACTIVA',
  PAUSADA: 'PAUSADA',
  COMPLETADA: 'COMPLETADA',
  ERROR_CONFIGURACION: 'ERROR_CONFIGURACION',
});

export const SESSION_MODALITY = Object.freeze({
  GRUPAL: 'GRUPAL',
  PERSONALIZADA: 'PERSONALIZADA',
  SOS: 'SOS',
});

export const SESSION_STATE_LABEL = Object.freeze({
  [SESSION_STATE.ACTIVA]: 'Activa',
  [SESSION_STATE.PAUSADA]: 'Pausada',
  [SESSION_STATE.COMPLETADA]: 'Completada',
  [SESSION_STATE.ERROR_CONFIGURACION]: 'Error de configuración',
});

export const SESSION_MODALITY_LABEL = Object.freeze({
  [SESSION_MODALITY.GRUPAL]: 'Grupal',
  [SESSION_MODALITY.PERSONALIZADA]: 'Personalizada',
  [SESSION_MODALITY.SOS]: 'SOS',
});

export const HISTORICAL_CONTENT = Object.freeze({
  VERIFIED: 'VERIFICADO',
  UNVERIFIABLE: 'NO_VERIFICABLE',
});

// Motivos de NO_VERIFICABLE del contrato, explicados para Psicología.
export const UNVERIFIABLE_REASON_LABEL = Object.freeze({
  NODO_NO_DISPONIBLE: 'El contenido ya no existe en el árbol conversacional.',
  NODO_FUERA_DE_VERSION:
    'El contenido no pertenece a la versión del árbol que usó la sesión.',
  VERSION_NO_PUBLICADA:
    'No se puede confirmar la versión publicada del árbol que usó la sesión.',
  NODO_MODIFICADO_TRAS_PUBLICACION:
    'El contenido se modificó después de publicarse la versión del árbol.',
  CONTENIDO_EXTERNO_NO_VERSIONADO:
    'El texto provenía de un contenido externo que puede haber cambiado.',
  CONTENIDO_NO_INTERPRETABLE:
    'El contenido guardado del árbol no se puede interpretar.',
});

export const INPUT_TYPE = Object.freeze({
  OPCION_UNICA: 'OPCION_UNICA',
  MULTISELECCION: 'MULTISELECCION',
  ESCALA: 'ESCALA',
  NUMERICO: 'NUMERICO',
  FECHA_HORA: 'FECHA_HORA',
  BOOLEANO: 'BOOLEANO',
  TEXTO_LIBRE: 'TEXTO_LIBRE',
  CONTINUAR: 'CONTINUAR',
});

export const INPUT_TYPE_LABEL = Object.freeze({
  [INPUT_TYPE.OPCION_UNICA]: 'Selección única',
  [INPUT_TYPE.MULTISELECCION]: 'Selección múltiple',
  [INPUT_TYPE.ESCALA]: 'Escala numérica',
  [INPUT_TYPE.NUMERICO]: 'Número',
  [INPUT_TYPE.FECHA_HORA]: 'Fecha u hora',
  [INPUT_TYPE.BOOLEANO]: 'Sí / No',
  [INPUT_TYPE.TEXTO_LIBRE]: 'Texto libre',
  [INPUT_TYPE.CONTINUAR]: 'Continuar (sin respuesta)',
});

export const NODE_TYPE_LABEL = Object.freeze({
  PREGUNTA: 'Pregunta',
  MENSAJE: 'Mensaje',
});

/*
 * Situación de una consulta. Se decide por estado HTTP y `codigo`, nunca
 * por el texto del error.
 */
export const TRACE_QUERY_STATUS = Object.freeze({
  LOADING: 'LOADING',
  READY: 'READY',
  // Parámetro de la ruta inválido: no se consulta nada.
  INVALID_ROUTE: 'INVALID_ROUTE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  DENIED: 'DENIED',
  PARTICIPANT_NOT_FOUND: 'PARTICIPANT_NOT_FOUND',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  INCONSISTENT_HISTORY: 'INCONSISTENT_HISTORY',
  // La respuesta no corresponde a lo pedido o no cumple el contrato.
  MISMATCH: 'MISMATCH',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
});
