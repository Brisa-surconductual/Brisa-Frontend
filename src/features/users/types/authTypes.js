export const USER_ROLE = Object.freeze({
  ESTUDIANTE: 'ESTUDIANTE',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
});

export const USER_ROLE_LABEL = Object.freeze({
  [USER_ROLE.ESTUDIANTE]: 'Estudiante',
  [USER_ROLE.ADMINISTRATIVO]: 'Administrativo',
});

export function getRoleLabel(role) {
  return USER_ROLE_LABEL[role] ?? '';
}

export const AUTH_API_ERROR = Object.freeze({
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_RECOVERY_CODE: 'INVALID_RECOVERY_CODE',
});