// Vista agregada de progresión narrativa y gamificación de una cohorte
// (RF-133, datos de M06 expuestos por RF-117). La envoltura de la
// respuesta (`estado`, `estado_agregacion`, `motivo_sin_datos`) y la
// situación de la vista son las comunes de RF-78, definidas en
// types/behavioralAggregate.js; aquí solo va lo propio de la narrativa.

// Fases narrativas de RF-133, en el orden en que se presentan.
export const NARRATIVE_PHASE = Object.freeze({
  START: 'INICIO',
  DEVELOPMENT: 'DESARROLLO',
  CLOSING: 'CIERRE',
});
