export const USER_ROLE = Object.freeze({
  ESTUDIANTE: 'ESTUDIANTE',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
  COORDINADOR_PSI: 'COORDINADOR_PSI',
});

export const USER_ROLE_LABEL = Object.freeze({
  [USER_ROLE.ESTUDIANTE]: 'Estudiante',
  [USER_ROLE.ADMINISTRATIVO]: 'Administrativo',
  [USER_ROLE.COORDINADOR_PSI]: 'Coordinación de psicología',
});

export function getRoleLabel(role) {
  return USER_ROLE_LABEL[role] ?? '';
}

export const AUTH_API_ERROR = Object.freeze({
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_RECOVERY_CODE: 'INVALID_RECOVERY_CODE',
});