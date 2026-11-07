import { COHORT_STATUS } from '../types/cohortStatus.js';

/*
 * ALMACÉN EN MEMORIA DEL MODO DE DEMOSTRACIÓN (solo desarrollo).
 *
 * Genérico: funciona con cualquier conjunto inicial de cohortes y
 * cronogramas. Vive mientras dure la carga de la aplicación (se
 * conserva al navegar y se restablece al recargar) y no usa
 * almacenamiento del navegador ni el servidor. Nunca modifica los
 * registros recibidos: cada cambio crea objetos nuevos.
 *
 * Las cohortes creadas aquí reciben identificadores temporales
 * (`demo-temporal-N`), distintos de los del backend.
 */
export const TEMPORARY_ID_PREFIX = 'demo-temporal-';

export function createCohortStore({ cohorts: initialCohorts = [], schedules = [] } = {}) {
  let cohorts = Object.freeze([...initialCohorts]);
  let nextId = 1;

  // Campos que fija el formulario (RF-124). El nombre del cronograma
  // se toma del catálogo solo para la demostración.
  function formFields({ name, startDate, endDate, scheduleId }) {
    return {
      name,
      startDate,
      endDate,
      scheduleId,
      scheduleName: schedules.find(({ id }) => id === scheduleId)?.name,
    };
  }

  function find(id) {
    return cohorts.find((cohort) => cohort.id === id) ?? null;
  }

  return {
    listCohorts: () => cohorts,

    findCohort: find,

    // RF-124: una cohorte nueva se guarda en BORRADOR, sin activarse.
    createCohort(values) {
      const cohort = Object.freeze({
        id: `${TEMPORARY_ID_PREFIX}${nextId}`,
        ...formFields(values),
        status: COHORT_STATUS.DRAFT,
      });

      nextId += 1;
      cohorts = Object.freeze([...cohorts, cohort]);

      return cohort;
    },

    // Cambia solo los campos del formulario; el estado se conserva.
    updateCohort(id, values) {
      const current = find(id);

      if (!current) return null;

      const updated = Object.freeze({ ...current, ...formFields(values) });
      cohorts = Object.freeze(
        cohorts.map((cohort) => (cohort.id === id ? updated : cohort)),
      );

      return updated;
    },

    listSchedules: () => schedules,
  };
}
