/*
 * Aviso del acceso y del registro. Ícono, título y texto acompañan
 * siempre al tono: el color no comunica el estado por sí solo.
 */
const TONE_CLASS = Object.freeze({
  info: 'border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-text)]',
  success:
    'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  warning:
    'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  danger:
    'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]',
  neutral:
    'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
});

export function FormNotice({
  tone = 'info',
  icon: Icon,
  title,
  role,
  children,
  action,
}) {
  return (
    <div
      className={`flex items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)] ${TONE_CLASS[tone] ?? TONE_CLASS.info}`}
      role={role}
    >
      {Icon && (
        <Icon
          size={20}
          strokeWidth={1.8}
          className="mt-[1px] shrink-0"
          aria-hidden="true"
        />
      )}

      <div className="min-w-0 flex-1">
        {title && (
          <strong className="block text-[length:var(--font-size-sm)] font-bold">
            {title}
          </strong>
        )}

        {children && (
          <div
            className={`text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] [overflow-wrap:anywhere] ${title ? 'mt-[2px]' : ''}`}
          >
            {children}
          </div>
        )}

        {action && <div className="mt-[var(--space-3)]">{action}</div>}
      </div>
    </div>
  );
}
