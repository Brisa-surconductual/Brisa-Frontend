import { Check } from 'lucide-react';

import styles from './Checkbox.module.css';

export function Checkbox({
  id,
  checked,
  children,
  error = false,
  disabled = false,
  className = '',
  ...inputProps
}) {
  const wrapperClasses = [
    styles.wrapper,
    error ? styles.wrapperError : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label
      className={wrapperClasses}
      htmlFor={id}
    >
      <input
        {...inputProps}
        id={id}
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        aria-invalid={error}
      />

      <span className={styles.box} aria-hidden="true">
        <Check
          className={styles.check}
          size={14}
          strokeWidth={3}
        />
      </span>

      <span className={styles.label}>
        {children}
      </span>
    </label>
  );
}