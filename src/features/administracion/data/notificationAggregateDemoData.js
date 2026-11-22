/*
 * DATOS FICTICIOS de la vista de efectividad de notificaciones (RF-134),
 * solo para el modo de demostración y las pruebas. No provienen de M07
 * ni del backend.
 *
 * Siguen el contrato de referencia de la Etapa 2 (GET
 * /admin/cohortes/{id_cohorte}/vistas/notificaciones, que el frontend no
 * consulta): `datos` con tasa_apertura_promedio, tasa_conversion_promedio,
 * total_notificaciones_enviadas, total_notificaciones_entregadas y
 * total_notificaciones_descartadas. La fecha viaja en la envoltura
 * (`ultimo_timestamp_disponible`), como en ese contrato; RF-134 y RF-101
 * también definen `fecha_actualizacion`, que aquí no se inventa.
 *
 * Las tasas son proporciones como las define RF-100 (abiertas /
 * entregadas; sesiones desde notificación / abiertas). Todos los valores
 * son arbitrarios y agregados: no hay historial individual ni se calculan
 * a partir de los participantes ficticios del M08. La Cohorte Piloto A
 * no tiene envíos: totales en 0 y tasas null (no calculables).
 */
export const DEMO_NOTIFICATION_NO_SENDS = Object.freeze({
  tasa_apertura_promedio: null,
  tasa_conversion_promedio: null,
  total_notificaciones_enviadas: 0,
  total_notificaciones_entregadas: 0,
  total_notificaciones_descartadas: 0,
});

export const DEMO_NOTIFICATION_DATA = Object.freeze({
  'demo-cohorte-a': DEMO_NOTIFICATION_NO_SENDS,
  'demo-cohorte-b': Object.freeze({
    tasa_apertura_promedio: 0.5825,
    tasa_conversion_promedio: 0.3125,
    total_notificaciones_enviadas: 412,
    total_notificaciones_entregadas: 398,
    total_notificaciones_descartadas: 21,
  }),
  'demo-cohorte-c': Object.freeze({
    tasa_apertura_promedio: 0.71,
    tasa_conversion_promedio: 0.4,
    total_notificaciones_enviadas: 265,
    total_notificaciones_entregadas: 251,
    total_notificaciones_descartadas: 9,
  }),
});

// Fecha de la última agregación diferida de cada cohorte ficticia.
export const DEMO_NOTIFICATION_TIMESTAMP = Object.freeze({
  'demo-cohorte-a': '2026-11-19T20:45:00Z',
  'demo-cohorte-b': '2026-11-20T12:15:00Z',
  'demo-cohorte-c': '2026-11-18T14:20:00Z',
});

/*
 * Datos individuales que la fuente ficticia añade a propósito: la
 * interfaz debe descartarlos (RF-134 prohíbe exponer el contenido de los
 * mensajes, el tipo de notificación de un usuario o cualquier dato que
 * asocie una notificación a un participante). Valores ficticios
 * reconocibles (PART-NNNN, example.com).
 */
export const DEMO_NOTIFICATION_FORBIDDEN_FIELDS = Object.freeze({
  metricas_por_usuario: Object.freeze([
    Object.freeze({
      id_usuario: '00000000-0000-4000-8000-0000000000cc',
      codigo: 'PART-0097',
      nombre: 'Participante notificado ficticio',
      correo: 'notificaciones.ficticias@example.com',
      tasa_apertura_usuario: 0.25,
      tasa_conversion_usuario: 0.1,
    }),
  ]),
  historial_notificaciones: Object.freeze([
    Object.freeze({
      id_notificacion: '00000000-0000-4000-8000-0000000000cd',
      id_usuario: '00000000-0000-4000-8000-0000000000cc',
      tipo_notificacion: 'RECORDATORIO_FICTICIO',
      contenido: 'Mensaje ficticio individual',
      interaccion: 'ABIERTA',
    }),
  ]),
  tasa_descarte: 0.05,
});
