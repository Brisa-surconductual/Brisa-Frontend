import styles from './TextField.module.css';

export function TextField({
  id,
  label,
  error = '',
  hint = '',
  startIcon = null,
  endAdornment = null,
  required = false,
  className = '',
  ...inputProps
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [
    error ? errorId : '',
    hint ? hintId : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const inputClasses = [
    styles.input,
    startIcon ? styles.withStartIcon : '',
    endAdornment ? styles.withEndAdornment : '',
    error ? styles.inputError : '',
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

      <div className={styles.inputWrapper}>
        {startIcon && (
          <span className={styles.startIcon} aria-hidden="true">
            {startIcon}
          </span>
        )}

        <input
          {...inputProps}
          id={id}
          className={inputClasses}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />

        {endAdornment && (
          <span className={styles.endAdornment}>
            {endAdornment}
          </span>
        )}
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