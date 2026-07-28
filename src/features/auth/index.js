export {
  login,
  requestPasswordRecovery,
  resetPassword,
} from './api/authApi.js';

export {
  AUTH_API_ERROR,
  USER_ROLE,
} from './types/authTypes.js';

export {
  isValidEmail,
  isValidPassword,
  validateLoginForm,
} from './services/authValidation.js';

/*
 * Las páginas (SplashPage, LoginPage, RecoverPage)
 * se reexportan aquí a medida que se implementan
 * en la tarea #145.
 */
