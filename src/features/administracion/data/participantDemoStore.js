import { ASSIGNMENT_ERROR, ASSIGNMENT_ISSUE } from '../types/participantAssignment.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';
import { DEMO_AVAILABILITY } from './participantCatalogDemoData.js';

/*
 * ALMACÉN DE PARTICIPANTES DEL MODO DE DEMOSTRACIÓN (solo desarrollo).
 *
 * Genérico: relaciona participantes y cohortes por `cohortId` y vive en
 * memoria mientras dure la carga de la aplicación (se conserva al
 * navegar y se restablece al recargar). Nunca modifica los registros
 * recibidos: cada asignación crea objetos nuevos. Una cohorte sin
 * participantes, incluida una creada temporalmente, devuelve una
 * lista vacía; no se generan registros por sí solos.
 *
 * Hace las veces del backend en la demostración: los conflictos y el
 * resultado de cada asignación se deciden AQUÍ (y el resultado viene
 * fijado en el catálogo ficticio), nunca en la interfaz. Reglas
 * PROVISIONALES hasta confirmar el contrato:
 *   - un participante no puede repetirse en la misma cohorte;
 *   - no puede asignarse si ya pertenece a otra cohorte ACTIVA;
 *   - la asignación múltiple es ATÓMICA: si algún participante tiene un
 *     conflicto no se asigna ninguno, y se devuelven todos los conflictos.
 *
 * `findCohort(id)` consulta el almacén de cohortes (el mismo del
 * listado) para saber si una cohorte existe y en qué estado está.
 */
export function createParticipantStore({ participants = [], catalog = [] } = {}) {
  let memberships = Object.freeze([...participants]);

  const findCandidate = (id) => catalog.find((candidate) => candidate.id === id) ?? null;

  function issueFor(cohortId, candidate, findCohort) {
    if (!candidate || candidate.demoAvailability === DEMO_AVAILABILITY.MISSING) {
      return ASSIGNMENT_ISSUE.PARTICIPANT_NOT_FOUND;
    }

    const own = memberships.filter(({ id }) => id === candidate.id);

    if (own.some((membership) => membership.cohortId === cohortId)) {
      return ASSIGNMENT_ISSUE.ALREADY_ASSIGNED;
    }

    if (own.some((membership) => findCohort(membership.cohortId)?.status === COHORT_STATUS.ACTIVE)) {
      return ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT;
    }

    if (candidate.demoAvailability === DEMO_AVAILABILITY.UNAVAILABLE) {
      return ASSIGNMENT_ISSUE.PARTICIPANT_UNAVAILABLE;
    }

    return null;
  }

  // Registro del participante dentro de la cohorte, con el resultado
  // explícito del catálogo ficticio.
  function toMembership(cohortId, candidate) {
    return Object.freeze({
      id: candidate.id,
      cohortId,
      code: candidate.code,
      participationStatus: candidate.demoResult.participationStatus,
      registrationStatus: candidate.registrationStatus,
      consentStatus: candidate.consentStatus,
      baselineStatus: candidate.baselineStatus,
      pendingReasons: candidate.demoResult.pendingReasons,
    });
  }

  return {
    listByCohort: (cohortId) =>
      Object.freeze(memberships.filter((participant) => participant.cohortId === cohortId)),

    /*
     * Catálogo para una cohorte: { id, code, issue } con `issue` null si
     * puede asignarse. `stale` imita un catálogo desactualizado: lista a
     * todos como disponibles y los conflictos aparecen al asignar.
     */
    listCandidates(cohortId, { findCohort, stale = false }) {
      return Object.freeze(
        catalog
          .filter((candidate) => stale || candidate.demoAvailability !== DEMO_AVAILABILITY.MISSING)
          .map((candidate) =>
            Object.freeze({
              id: candidate.id,
              code: candidate.code,
              issue: stale ? null : issueFor(cohortId, candidate, findCohort),
            }),
          ),
      );
    },

    /*
     * Devuelve { ok: true, assigned } con los registros creados, o
     * { ok: false, error, issues } sin cambiar nada. `issues` lista
     * { participantId, code, issue } de cada participante en conflicto.
     */
    assign(cohortId, participantIds, { findCohort }) {
      const ids = [...new Set(Array.isArray(participantIds) ? participantIds : [])];

      if (ids.length === 0) {
        return Object.freeze({ ok: false, error: ASSIGNMENT_ERROR.EMPTY_SELECTION, issues: [] });
      }

      if (!findCohort(cohortId)) {
        return Object.freeze({ ok: false, error: ASSIGNMENT_ERROR.COHORT_NOT_FOUND, issues: [] });
      }

      const issues = ids.flatMap((participantId) => {
        const candidate = findCandidate(participantId);
        const issue = issueFor(cohortId, candidate, findCohort);

        return issue ? [Object.freeze({ participantId, code: candidate?.code ?? null, issue })] : [];
      });

      if (issues.length > 0) {
        return Object.freeze({ ok: false, error: ASSIGNMENT_ERROR.CONFLICT, issues: Object.freeze(issues) });
      }

      const assigned = Object.freeze(ids.map((id) => toMembership(cohortId, findCandidate(id))));
      memberships = Object.freeze([...memberships, ...assigned]);

      return Object.freeze({ ok: true, assigned });
    },
  };
}
