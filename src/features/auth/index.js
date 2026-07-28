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
  validateRecoverRequestForm,
  validateRecoverResetForm,
} from '@/features/auth/services/authValidation.js';

export { SplashPage } from '@/features/auth/pages/SplashPage/index.js';
export { LoginPage } from '@/features/auth/pages/LoginPage/index.js';
export { RecoverRequestPage } from '@/features/auth/pages/RecoverRequestPage/index.js';
export { RecoverResetPage } from '@/features/auth/pages/RecoverResetPage/index.js';
