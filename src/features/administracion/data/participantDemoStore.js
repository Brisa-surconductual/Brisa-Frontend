import { ASSIGNMENT_ERROR, ASSIGNMENT_ISSUE } from '../types/participantAssignment.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';
import { REMOVAL_ERROR } from '../types/participantRemoval.js';
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
 * fijado en los datos ficticios: el catálogo o el registro inicial de
 * cada participante), nunca en la interfaz. Reglas
 * PROVISIONALES hasta confirmar el contrato:
 *   - un participante no puede repetirse en la misma cohorte;
 *   - no puede asignarse si ya pertenece a otra cohorte ACTIVA;
 *   - la asignación múltiple es ATÓMICA: si algún participante tiene un
 *     conflicto no se asigna ninguno, y se devuelven todos los conflictos.
 *
 * `findCohort(id)` consulta el almacén de cohortes (el mismo del
 * listado) para saber si una cohorte existe y en qué estado está.
 */
/*
 * Participante del registro a partir de una asociación inicial: conserva
 * su código, sus estados administrativos y, como resultado de una nueva
 * asignación, el estado y los motivos que ya informó la fuente para él.
 * No se calcula nada nuevo.
 */
function fromMembership(membership) {
  return Object.freeze({
    id: membership.id,
    code: membership.code,
    registrationStatus: membership.registrationStatus,
    consentStatus: membership.consentStatus,
    baselineStatus: membership.baselineStatus,
    demoResult: Object.freeze({
      participationStatus: membership.participationStatus,
      pendingReasons: Object.freeze([...(membership.pendingReasons ?? [])]),
    }),
  });
}

/*
 * Registro único de participantes de la demostración: los asociados al
 * inicio y los del catálogo, una sola vez por identificador (si uno
 * aparece en ambos, manda el catálogo). Retirar una asociación no los
 * borra de aquí, así pueden volver a ofrecerse para asignación.
 */
function buildRegistry(participants, catalog) {
  const registry = new Map();

  for (const membership of participants) {
    if (!registry.has(membership.id)) registry.set(membership.id, fromMembership(membership));
  }

  for (const candidate of catalog) registry.set(candidate.id, candidate);

  return Object.freeze([...registry.values()]);
}

export function createParticipantStore({ participants = [], catalog = [] } = {}) {
  let memberships = Object.freeze([...participants]);
  const registry = buildRegistry(participants, catalog);

  const findCandidate = (id) => registry.find((candidate) => candidate.id === id) ?? null;

  // Existe en la demostración (los marcados como inexistentes, no).
  const isKnown = (id) => {
    const candidate = findCandidate(id);
    return Boolean(candidate) && candidate.demoAvailability !== DEMO_AVAILABILITY.MISSING;
  };

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
     * Catálogo para una cohorte: todo el registro como { id, code, issue },
     * con `issue` null si puede asignarse según el estado actual de las
     * asociaciones. `stale` imita un catálogo desactualizado: lista a
     * todos como disponibles y los conflictos aparecen al asignar.
     */
    listCandidates(cohortId, { findCohort, stale = false }) {
      return Object.freeze(
        registry
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

    /*
     * Retiro (RF-125, semántica PROVISIONAL): elimina solo la asociación
     * del participante con esta cohorte. Vuelve a verificar la cohorte y
     * la asociación antes de aplicarlo, así un retiro repetido o con
     * datos desactualizados no cambia nada ni informa un éxito falso.
     * Devuelve { ok: true, removed } o { ok: false, error }.
     */
    remove(cohortId, participantId, { findCohort }) {
      if (!findCohort(cohortId)) {
        return Object.freeze({ ok: false, error: REMOVAL_ERROR.COHORT_NOT_FOUND });
      }

      if (!isKnown(participantId)) {
        return Object.freeze({ ok: false, error: REMOVAL_ERROR.PARTICIPANT_NOT_FOUND });
      }

      const removed = memberships.find(({ id, cohortId: owner }) => id === participantId && owner === cohortId);

      if (!removed) return Object.freeze({ ok: false, error: REMOVAL_ERROR.NOT_ASSOCIATED });

      memberships = Object.freeze(memberships.filter((membership) => membership !== removed));

      return Object.freeze({ ok: true, removed });
    },
  };
}
