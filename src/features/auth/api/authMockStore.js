import { USER_ROLE } from '../types/authTypes.js';

/*
 * Cuentas de demostración. En la implementación
 * real la autenticación la resuelve el backend;
 * este mock solo permite navegar el flujo.
 */
const DEMO_ACCOUNTS = new Map([
  [
    'estudiante@usco.edu.co',
    {
      password: 'Brisa2026#',
      role: USER_ROLE.ESTUDIANTE,
    },
  ],
  [
    'psicologia@usco.edu.co',
    {
      password: 'Admin2026#',
      role: USER_ROLE.PSICOLOGIA,
    },
  ],
]);

const DEMO_RECOVERY_CODE = '123456';

export function findAccount(email) {
  return DEMO_ACCOUNTS.get(email) ?? null;
}

export function isValidRecoveryCode(code) {
  return code === DEMO_RECOVERY_CODE;
}
