import { ChevronDown } from 'lucide-react';

import styles from './SelectField.module.css';

export function SelectField({
  id,
  label,
  options,
  placeholder = 'Selecciona una opción',
  error = '',
  hint = '',
  required = false,
  className = '',
  ...selectProps
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [
    error ? errorId : '',
    hint ? hintId : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const selectClasses = [
    styles.select,
    error ? styles.selectError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label} htmlFor={id}>
        {label}

        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className={styles.wrapper}>
        <select
          {...selectProps}
          id={id}
          className={selectClasses}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className={styles.icon}
          size={18}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </div>

      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}