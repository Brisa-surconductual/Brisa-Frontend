// Estados de una cohorte (RF-124, estado_cohorte).
// Las transiciones permitidas entre estados aún no están
// definidas en la especificación: no se codifican aquí.
export const COHORT_STATUS = Object.freeze({
  DRAFT: 'BORRADOR',
  ACTIVE: 'ACTIVA',
  INACTIVE: 'INACTIVA',
});
