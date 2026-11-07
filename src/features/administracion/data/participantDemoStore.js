/*
 * ALMACÉN DE PARTICIPANTES DEL MODO DE DEMOSTRACIÓN (solo desarrollo).
 *
 * Genérico y de solo lectura (E5 es una consulta): relaciona cada
 * participante con su cohorte por `cohortId`. No genera registros:
 * una cohorte sin participantes, incluida una creada temporalmente,
 * devuelve una lista vacía.
 */
export function createParticipantStore({ participants = [] } = {}) {
  const all = Object.freeze([...participants]);

  return {
    listByCohort: (cohortId) =>
      Object.freeze(all.filter((participant) => participant.cohortId === cohortId)),
  };
}
