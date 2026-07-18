import { LoaderCircle } from 'lucide-react';

import styles from './Button.module.css';

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  loadingText = 'Procesando...',
  disabled = false,
  className = '',
  type = 'button',
  ...buttonProps
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...buttonProps}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <LoaderCircle
            className={styles.spinner}
            size={18}
            strokeWidth={2}
            aria-hidden="true"
          />

          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}