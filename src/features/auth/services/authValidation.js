const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value.trim());
}

/*
 * Política RF-01: mínimo 8 caracteres, al menos
 * una mayúscula, un número y un carácter especial.
 */
export function isValidPassword(value) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export function validateLoginForm(form) {
  const errors = {};

  if (!isValidEmail(form.email)) {
    errors.email = 'Ingresa un correo válido.';
  }

  if (!form.password) {
    errors.password = 'Ingresa tu contraseña.';
  }

  return errors;
}

export function validateRecoverRequestForm(form) {
  const errors = {};

  if (!isValidEmail(form.email)) {
    errors.email = 'Ingresa un correo válido.';
  }

  return errors;
}

const RECOVERY_CODE_PATTERN = /^\d{6}$/;

export function validateRecoverResetForm(form) {
  const errors = {};

  if (!RECOVERY_CODE_PATTERN.test(form.code.trim())) {
    errors.code = 'Ingresa el código de 6 dígitos.';
  }

  if (!isValidPassword(form.password)) {
    errors.password = 'La contraseña no cumple la política de seguridad.';
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}
