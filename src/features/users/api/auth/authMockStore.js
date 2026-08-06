import { USER_ROLE } from '@/features/users/types/authTypes.js';

/*
 * Almacén de cuentas simuladas.
 *
 * En la implementación real, estas credenciales
 * serán administradas exclusivamente por el backend.
 *
 * Este Map existe únicamente para probar el flujo
 * completo desde el frontend.
 */
const AUTH_ACCOUNTS = new Map([
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

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function findAccount(email) {
  const normalizedEmail = normalizeEmail(email);

  return AUTH_ACCOUNTS.get(normalizedEmail) ?? null;
}

export function authAccountExists(email) {
  const normalizedEmail = normalizeEmail(email);

  return AUTH_ACCOUNTS.has(normalizedEmail);
}

/*
 * Registra en el mock de autenticación una cuenta
 * que terminó correctamente el proceso de registro.
 *
 * La función devuelve una sesión con la misma
 * estructura utilizada por authApi.login().
 */
export function registerAuthAccount({ email, password, role }) {
  const normalizedEmail = normalizeEmail(email);

  AUTH_ACCOUNTS.set(normalizedEmail, {
    password,
    role,
  });

  return {
    email: normalizedEmail,
    role,
  };
}

export function isValidRecoveryCode(code) {
  return code === DEMO_RECOVERY_CODE;
}
