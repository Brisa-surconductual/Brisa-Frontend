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

  const inputStateClass = error
    ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgb(193_59_48/8%)]'
    : 'border-[var(--surface-border)]';

  const paddingClass = [
    startIcon ? 'pl-[42px]' : '',
    endAdornment ? 'pr-[44px]' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`flex flex-col gap-[6px] ${className}`}>
      <label className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]" htmlFor={id}>
        {label}

        {required && (
          <span className="text-[var(--danger-text)]" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {startIcon && (
          <span className="pointer-events-none absolute top-1/2 left-[13px] inline-flex -translate-y-1/2 items-center justify-center text-[var(--text-muted)]" aria-hidden="true">
            {startIcon}
          </span>
        )}

        <input
          {...inputProps}
          id={id}
          className={`min-h-[44px] w-full rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[14px] text-[var(--text-primary)] transition-[border-color,box-shadow] duration-120 placeholder:text-[var(--text-muted)] placeholder:opacity-75 enabled:hover:border-[var(--neutral-300)] focus:border-[var(--brand-400)] focus:outline-none focus:shadow-[0_0_0_3px_rgb(29_131_120/12%)] disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] disabled:text-[var(--text-muted)] motion-reduce:transition-none ${paddingClass} ${inputStateClass}`}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />

        {endAdornment && (
          <span className="absolute top-1/2 right-[8px] inline-flex -translate-y-1/2 items-center justify-center">
            {endAdornment}
          </span>
        )}
      </div>

      {hint && (
        <p id={hintId} className="m-0 text-[11px] leading-[1.45] text-[var(--text-muted)]">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}