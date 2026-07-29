/*
 * Etiqueta visible del rol. Duplica a propósito la de
 * features/student: las features no se importan entre
 * sí. Ya son dos dominios con la misma necesidad, así
 * que USER_ROLE y sus etiquetas son candidatas claras
 * a subir a shared/ en un PR aparte.
 */
const ROLE_LABEL = Object.freeze({
  ESTUDIANTE: 'Estudiante',
  PSICOLOGIA: 'Psicología',
});

export function getRoleLabel(role) {
  return ROLE_LABEL[role] ?? '';
}
