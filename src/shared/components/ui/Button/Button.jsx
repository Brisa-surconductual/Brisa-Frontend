import { LoaderCircle } from 'lucide-react';

const VARIANT_CLASS = Object.freeze({
  primary: 'bg-[var(--brand-500)] text-[var(--button-primary-text)] enabled:hover:bg-[var(--brand-600)] [html[data-theme="dark"]_&]:enabled:hover:bg-[var(--brand-400)]',

  secondary: 'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-primary)] enabled:hover:bg-[var(--surface-hover)]',

  ghost: 'bg-transparent text-[var(--text-secondary)] enabled:hover:bg-[var(--surface-hover)] enabled:hover:text-[var(--text-primary)]',

  danger: 'bg-[var(--danger)] text-[var(--neutral-0)] enabled:hover:bg-[var(--danger-text)]',
});

const SIZE_CLASS = Object.freeze({
  small: 'min-h-[34px] px-[14px] py-[7px] text-[12px]',
  medium: 'min-h-[42px] px-[18px] py-[10px] text-[14px]',
  large: 'min-h-[48px] px-[24px] py-[12px] text-[15px]',
});

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
  const variantClass =
    VARIANT_CLASS[variant] ??
    VARIANT_CLASS.primary;

  const sizeClass =
    SIZE_CLASS[size] ??
    SIZE_CLASS.medium;

  const widthClass = fullWidth
    ? 'w-full'
    : '';

  const classes = [
  'inline-flex items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] border-[1.5px] border-transparent [font-family:var(--font-sans)] font-bold leading-[1.2] no-underline transition-[background-color,border-color,color,transform] duration-[120ms] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none',
    variantClass,
    sizeClass,
    widthClass,
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
            className="animate-[spin_700ms_linear_infinite] motion-reduce:animate-[spin_1400ms_linear_infinite]"
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