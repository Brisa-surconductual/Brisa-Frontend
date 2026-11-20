/*
 * Consulta temporal del participante (M04) en la ficha. Constantes
 * PROVISIONALES de la interfaz, pendientes del contrato del backend.
 *
 * Fundamento: RF-22 (salida: unidad temporal vigente, tiempo efectivo
 * transcurrido e indicador de cronograma finalizado) y RF-22B (pausas
 * administrativas: fecha de inicio, fecha de fin y estado). No hay un
 * requerimiento del M08 que defina esta consulta ni sus errores.
 */

// Estado de una pausa administrativa (RF-22B, estado_pausa).
export const PAUSE_STATUS = Object.freeze({
  ACTIVE: 'ACTIVA',
  FINISHED: 'FINALIZADA',
  CANCELLED: 'ANULADA',
});
