/*
 * Aviso del login con tono semántico. El color nunca va solo:
 * siempre lo acompañan ícono, título y texto.
 */
const TONE_CLASS = Object.freeze({
  success:
    'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  warning:
    'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  danger:
    'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]',
});

export function LoginNotice({ tone, icon: Icon, title, role, children }) {
  return (
    <div
      className={`flex items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)] ${TONE_CLASS[tone]}`}
      role={role}
    >
      <Icon
        size={20}
        strokeWidth={1.8}
        className="mt-[2px] shrink-0"
        aria-hidden="true"
      />

      <div className="min-w-0">
        <strong className="block text-[length:var(--font-size-sm)] leading-[var(--line-height-snug)]">
          {title}
        </strong>

        <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)]">
          {children}
        </p>
      </div>
    </div>
  );
}
