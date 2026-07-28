import { useState } from 'react';

import { Eye, EyeOff, LockKeyhole } from 'lucide-react';

import { TextField } from '@/shared/components/ui/TextField/index.js';

import styles from './PasswordField.module.css';

/*
 * Campo de contraseña con mostrar/ocultar, local a
 * RecoverResetPage. NO incluye PasswordStrength (vive en
 * features/users, y las features no se importan entre
 * sí). Si conviene un medidor de fortaleza acá también,
 * mover PasswordStrength a shared/ en un PR aparte y
 * pequeño, y luego adoptarlo en ambos flujos.
 */
export function PasswordField({
  id,
  name,
  label,
  placeholder,
  value,
  error,
  onChange,
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);

  const visibilityLabel = isVisible
    ? `Ocultar ${label.toLowerCase()}`
    : `Mostrar ${label.toLowerCase()}`;

  function toggleVisibility() {
    setIsVisible((currentValue) => !currentValue);
  }

  return (
    <TextField
      id={id}
      name={name}
      type={isVisible ? 'text' : 'password'}
      label={label}
      placeholder={placeholder}
      autoComplete="new-password"
      value={value}
      error={error}
      onChange={onChange}
      disabled={disabled}
      startIcon={<LockKeyhole size={19} strokeWidth={1.5} aria-hidden="true" />}
      endAdornment={
        <button
          type="button"
          className={styles.visibilityButton}
          onClick={toggleVisibility}
          aria-label={visibilityLabel}
          aria-pressed={isVisible}
          disabled={disabled}
        >
          {isVisible ? (
            <EyeOff size={19} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Eye size={19} strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      }
      required
    />
  );
}
