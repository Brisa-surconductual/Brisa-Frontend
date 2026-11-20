// RF-29 / RF-30: resultado del POST de respuestas → modelo de la interfaz.
// Solo lo que la pantalla usa: la secuencia confirmada (para el siguiente
// envío) y el estado de la sesión (ACTIVA o COMPLETADA).
export function mapResultadoRespuesta(data) {
  return Object.freeze({
    secuencia: Number.isInteger(data?.secuencia) ? data.secuencia : null,
    estadoSesion: data?.estado_sesion ?? null,
  });
}
