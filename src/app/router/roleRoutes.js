import { USER_ROLE } from '@/features/users/types/authTypes.js';

export const LOGIN_PATH = '/login';

/*
 * Home de cada rol dentro de la app. Es el único
 * lugar que decide a dónde entra cada usuario: lo
 * reusan el dispatcher de /app y RequireAuth.
 */
const ROLE_HOME_PATH = Object.freeze({
  [USER_ROLE.ESTUDIANTE]: '/app/estudiante',
  [USER_ROLE.PSICOLOGIA]: '/app/psicologia',
});

export function getHomePathForRole(role) {
  /*
   * Un rol desconocido no tiene home: se devuelve
   * al login en lugar de adivinar una pantalla.
   */
  return ROLE_HOME_PATH[role] ?? LOGIN_PATH;
}
