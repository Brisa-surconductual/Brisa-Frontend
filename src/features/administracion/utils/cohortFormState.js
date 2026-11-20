// Estado del formulario de cohorte (RF-124). Estructura normal e
// independiente de la fuente de datos.
export const INITIAL_COHORT_FORM = Object.freeze({
  name: '',
  startDate: '',
  endDate: '',
  scheduleId: '',
});

// Orden de los campos: el foco va al primero con error.
export const COHORT_FORM_FIELDS = Object.freeze(['name', 'startDate', 'endDate', 'scheduleId']);

// Valores de una cohorte existente para precargar la edición.
export function toCohortForm(cohort) {
  return {
    name: cohort?.name ?? '',
    startDate: cohort?.startDate ?? '',
    endDate: cohort?.endDate ?? '',
    scheduleId: cohort?.scheduleId ?? '',
  };
}

// Valores que se envían a la fuente: el nombre sin espacios sobrantes.
export function normalizeCohortForm(form) {
  return {
    name: form.name.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    scheduleId: form.scheduleId,
  };
}

export function firstInvalidField(errors) {
  return COHORT_FORM_FIELDS.find((field) => errors[field]) ?? null;
}
