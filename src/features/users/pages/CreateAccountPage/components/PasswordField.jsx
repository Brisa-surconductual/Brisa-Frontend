import { useState } from 'react';

import {
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react';

import {
  TextField,
} from '../../../../../shared/components/ui/TextField/index.js';

import {
  PasswordStrength,
} from '../../../components/PasswordStrength/index.js';

import styles from './PasswordField.module.css';

export function PasswordField({
  id,
  name,
  label,
  placeholder,
  value,
  error,
  onChange,
  showStrength = false,
  disabled = false,
}) {
  const [isVisible, setIsVisible] =
    useState(false);

  const visibilityLabel = isVisible
    ? `Ocultar ${label.toLowerCase()}`
    : `Mostrar ${label.toLowerCase()}`;

  function toggleVisibility() {
    setIsVisible((currentValue) =>
      !currentValue,
    );
  }

  return (
    <div className={styles.group}>
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
        startIcon={
          <LockKeyhole
            size={19}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        }
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
              <EyeOff
                size={19}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            ) : (
              <Eye
                size={19}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            )}
          </button>
        }
        required
      />

      {showStrength && (
        <PasswordStrength password={value} />
      )}
    </div>
  );
}