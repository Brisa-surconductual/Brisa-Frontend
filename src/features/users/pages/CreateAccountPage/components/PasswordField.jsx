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
  const [isVisible, setIsVisible] = useState(false);

  const visibilityLabel = isVisible
    ? `Ocultar ${label.toLowerCase()}`
    : `Mostrar ${label.toLowerCase()}`;

  function toggleVisibility() {
    setIsVisible((currentValue) => !currentValue);
  }

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
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
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border-0 bg-transparent p-[var(--space-1)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)] disabled:cursor-not-allowed disabled:opacity-60"
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