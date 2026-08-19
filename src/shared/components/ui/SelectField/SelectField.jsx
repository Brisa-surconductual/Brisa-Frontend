import { ChevronDown } from 'lucide-react';

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

  const selectStateClass = error
    ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgb(193_59_48/8%)]'
    : 'border-[var(--surface-border)]';

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
        <select
          {...selectProps}
          id={id}
          className={`w-full min-h-[44px] cursor-pointer appearance-none rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] py-[10px] pr-[42px] pl-[13px] font-[var(--font-sans)] text-[14px] text-[var(--text-primary)] transition-[border-color,box-shadow] duration-120 enabled:hover:border-[var(--neutral-300)] focus:border-[var(--brand-400)] focus:outline-none focus:shadow-[0_0_0_3px_rgb(29_131_120/12%)] disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] disabled:text-[var(--text-muted)] motion-reduce:transition-none ${selectStateClass}`}
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

        <ChevronDown className="pointer-events-none absolute top-1/2 right-[13px] -translate-y-1/2 text-[var(--text-muted)]" size={18} strokeWidth={1.7} aria-hidden="true" />
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