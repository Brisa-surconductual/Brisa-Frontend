/*
 * Etiqueta visible del rol. No se importa USER_ROLE
 * de features/auth porque las features no se importan
 * entre sí: cuando un segundo dominio necesite estas
 * constantes, deben subir a shared/.
 */
const ROLE_LABEL = Object.freeze({
  ESTUDIANTE: 'Estudiante',
  PSICOLOGIA: 'Psicología',
});

export function getRoleLabel(role) {
  return ROLE_LABEL[role] ?? '';
}
