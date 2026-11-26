/*
 * Aviso del área de cronogramas. Ícono y texto acompañan siempre
 * al tono: el color nunca comunica el estado por sí solo.
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
    'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]',
});

export function PanelNotice({
  tone = 'info',
  icon: Icon,
  title,
  role,
  action,
  children,
}) {
  return (
    <div
      className={`flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between ${TONE_CLASS[tone] ?? TONE_CLASS.info}`}
      role={role}
    >
      <div className="flex min-w-0 items-start gap-[var(--space-3)]">
        {Icon && (
          <Icon
            size={20}
            strokeWidth={1.8}
            className="mt-[2px] shrink-0"
            aria-hidden="true"
          />
        )}

        <div className="min-w-0">
          {title && (
            <strong className="block text-[length:var(--font-size-sm)]">
              {title}
            </strong>
          )}

          {children && (
            <p
              className={`mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] ${title ? 'mt-[var(--space-1)]' : 'mt-0'}`}
            >
              {children}
            </p>
          )}
        </div>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
