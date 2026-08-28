import { USER_ROLE } from '@/features/users/types/authTypes.js';

export const LOGIN_PATH = '/login';

const ROLE_HOME_PATH = Object.freeze({
  [USER_ROLE.ESTUDIANTE]: '/app/estudiante',
  [USER_ROLE.ADMINISTRATIVO]: '/app/administrativo',
});

export function getHomePathForRole(role) {
  return ROLE_HOME_PATH[role] ?? LOGIN_PATH;
}