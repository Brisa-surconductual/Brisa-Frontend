// Equivale a /^[^\s@]+@[^\s@]+\.[^\s@]+$/ sin backtracking: sin espacios,
// una sola @, parte local no vacía y un punto con texto antes y después en el
// dominio.
function hasEmailShape(value) {
  if (/\s/.test(value)) return false;
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && domain.slice(1, -1).includes('.');
}

export const PASSWORD_RULES = [
  {
    key: 'minimumLength',
    label: 'Mínimo 8 caracteres',
    validate: (value) => value.length >= 8,
  },
  {
    key: 'uppercase',
    label: 'Al menos 1 mayúscula',
    validate: (value) => /[A-Z]/.test(value),
  },
  {
    key: 'number',
    label: 'Al menos 1 número',
    validate: (value) => /[0-9]/.test(value),
  },
  {
    key: 'specialCharacter',
    label: 'Al menos 1 carácter especial',
    validate: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
];

export function evaluatePassword(password = '') {
  const rules = PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    met: rule.validate(password),
  }));

  const completedRules = rules.filter((rule) => rule.met).length;

  let level = 'empty';

  if (password) {
    if (completedRules <= 2) {
      level = 'weak';
    } else if (completedRules === 3) {
      level = 'fair';
    } else {
      level = 'strong';
    }
  }

  return {
    rules,
    completedRules,
    level,
    isValid: completedRules === PASSWORD_RULES.length,
  };
}

export function validateAccountForm({
  email,
  password,
  confirmPassword,
}) {
  const errors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = 'El correo electrónico es obligatorio.';
  } else if (!hasEmailShape(normalizedEmail)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  const passwordEvaluation = evaluatePassword(password);

  if (!password) {
    errors.password = 'La contraseña es obligatoria.';
  } else if (!passwordEvaluation.isValid) {
    errors.password = 'La contraseña no cumple la política de seguridad.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}