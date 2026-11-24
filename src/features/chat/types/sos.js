/*
 * RF-43: protocolo SOS «Tengo ganas de vapear». Valores del contrato del
 * backend (Brisa-Backend, docs/CONTRATO_RF43_SOS_CRAVING.md). Los textos
 * son de la interfaz; los valores, del backend.
 */

export const SOS_PATH = '/app/estudiante/sos';

// Ampliación B: módulo desde el que se oprimió el botón.
export const MODULO_ORIGEN_SOS = Object.freeze({
  CHAT: 'CHAT',
  DIARIO: 'DIARIO',
  CRONOGRAMA: 'CRONOGRAMA',
  CONTENIDO: 'CONTENIDO',
  PERFIL: 'PERFIL',
  OTRO: 'OTRO',
});

// Motivo con el que el cliente pide el cierre. El estado final lo decide
// el backend (con su reloj y el estado real de la sesión SOS).
export const MOTIVO_FINALIZACION_SOS = Object.freeze({
  COMPLETADA: 'COMPLETADA',
  CERRADA_POR_USUARIO: 'CERRADA_POR_USUARIO',
  TIEMPO_AGOTADO: 'TIEMPO_AGOTADO',
});

export const ESTADO_INTERVENCION_SOS = Object.freeze({
  COMPLETA: 'COMPLETA',
  INCOMPLETA: 'INCOMPLETA',
  EXPIRADA: 'EXPIRADA',
});

export const ESTADO_INTERVENCION_SOS_LABEL = Object.freeze({
  [ESTADO_INTERVENCION_SOS.COMPLETA]: 'Ejercicio completado',
  [ESTADO_INTERVENCION_SOS.INCOMPLETA]: 'Ejercicio terminado antes del final',
  [ESTADO_INTERVENCION_SOS.EXPIRADA]: 'Se agotó el tiempo del ejercicio',
});

// Códigos de error del contrato RF-43 (se decide por `codigo`).
export const CODIGO_ERROR_SOS = Object.freeze({
  SIN_FLUJO_SOS: 'SIN_FLUJO_SOS',
  INTERVENCION_EN_CURSO: 'INTERVENCION_EN_CURSO',
  INTERVENCION_NO_ENCONTRADA: 'INTERVENCION_NO_ENCONTRADA',
  INTERVENCION_FINALIZADA: 'INTERVENCION_FINALIZADA',
  TIEMPO_AGOTADO: 'TIEMPO_AGOTADO',
});

// Situación de la intervención en la interfaz.
export const FASE_SOS = Object.freeze({
  // La pestaña no tiene una intervención en memoria (p. ej. tras F5).
  SIN_INTERVENCION: 'SIN_INTERVENCION',
  ACTIVANDO: 'ACTIVANDO',
  ERROR_ACTIVACION: 'ERROR_ACTIVACION',
  EN_CURSO: 'EN_CURSO',
  FINALIZANDO: 'FINALIZANDO',
  ERROR_FINALIZACION: 'ERROR_FINALIZACION',
  FINALIZADA: 'FINALIZADA',
});

// Qué hace la pantalla con un error al enviar una respuesta.
export const ACCION_ERROR_ENVIO_SOS = Object.freeze({
  // 400: el formulario sigue editable con el mensaje del backend.
  INLINE: 'INLINE',
  // Sin respuesta o 5xx: se reenvía el mismo cuerpo (mismo id_interaccion).
  REINTENTAR: 'REINTENTAR',
  // Cualquier otro: no se puede seguir respondiendo; queda cerrar.
  BLOQUEADO: 'BLOQUEADO',
});
