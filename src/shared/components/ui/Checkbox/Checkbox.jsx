import { Check } from 'lucide-react';

export function Checkbox({
  id,
  checked,
  children,
  error = false,
  disabled = false,
  className = '',
  ...inputProps
}) {
  const wrapperStateClass = error
    ? 'border-[var(--danger-border)] bg-[var(--danger-bg)]'
    : 'border-transparent';

  const disabledClass = disabled
    ? 'cursor-not-allowed opacity-50 hover:bg-transparent'
    : 'cursor-pointer hover:bg-[var(--surface-hover)]';

  const wrapperClasses = [
    'relative flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)] transition-[background-color,border-color] duration-[120ms]',
    wrapperStateClass,
    disabledClass,
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
        className="peer absolute h-px w-px overflow-hidden opacity-0 pointer-events-none"
        checked={checked}
        disabled={disabled}
        aria-invalid={error}
      />

      <span
        className={`mt-px inline-flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-[background-color,border-color,box-shadow] duration-[120ms] peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--brand-500)] ${
          checked
            ? 'border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--neutral-0)]'
            : 'border-[var(--surface-border)] bg-[var(--surface-card)] text-transparent'
        }`}
        aria-hidden="true"
      >
        <Check
          className={`transition-[opacity,transform] duration-[120ms] ${
            checked
              ? 'scale-100 opacity-100'
              : 'scale-[0.7] opacity-0'
          }`}
          size={14}
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>

      <span className="text-[13px] leading-[1.55] text-[var(--text-primary)]">
        {children}
      </span>
    </label>
  );
}