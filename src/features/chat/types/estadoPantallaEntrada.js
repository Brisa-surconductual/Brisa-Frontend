// RF-24: estados de la pantalla de entrada al chat.
// CARGANDO y ERROR vienen del contrato 3. REANUDANDO aplica cuando el
// backend devuelve `reanudada: true`. LISTA es la sesión recién creada.
export const ESTADO_PANTALLA_ENTRADA = Object.freeze({
  CARGANDO: 'CARGANDO',
  REANUDANDO: 'REANUDANDO',
  LISTA: 'LISTA',
  ERROR: 'ERROR',
});
