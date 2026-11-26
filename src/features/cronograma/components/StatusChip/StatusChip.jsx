/*
 * Chip de estado con ícono y texto: el tono acompaña, nunca
 * comunica el estado por sí solo. Cada pantalla resuelve qué
 * tono e ícono corresponden a su propio catálogo de estados.
 */
const TONE_CLASS = Object.freeze({
  brand: 'border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]',
  success:
    'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  warning:
    'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  danger:
    'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]',
  info: 'border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-text)]',
  neutral:
    'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
});

export function StatusChip({ tone = 'neutral', icon: Icon, children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${TONE_CLASS[tone] ?? TONE_CLASS.neutral}`}
    >
      {Icon && <Icon size={13} strokeWidth={2} aria-hidden="true" />}
      {children}
    </span>
  );
}
