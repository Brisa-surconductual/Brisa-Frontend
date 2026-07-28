export {
  login,
  requestPasswordRecovery,
  resetPassword,
} from '@/features/auth/api/authApi.js';

export { AUTH_API_ERROR, USER_ROLE } from '@/features/auth/types/authTypes.js';

export {
  isValidEmail,
  isValidPassword,
  validateLoginForm,
} from '@/features/auth/services/authValidation.js';

/*
 * Las páginas (SplashPage, LoginPage, RecoverPage)
 * se reexportan aquí a medida que se implementan
 * en la tarea #145.
 */
