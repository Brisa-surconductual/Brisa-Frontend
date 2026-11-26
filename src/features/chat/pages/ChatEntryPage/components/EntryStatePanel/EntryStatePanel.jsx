/*
 * Tarjeta central de la pantalla de entrada al chat. El tono nunca
 * comunica el estado solo: siempre lleva visual (ícono o isotipo) y
 * texto.
 */
const TONE_CLASS = Object.freeze({
  neutral: 'border-[var(--surface-border)] bg-[var(--surface-card)]',
  danger: 'border-[var(--danger-border)] bg-[var(--danger-bg)]',
});

const TITLE_TONE_CLASS = Object.freeze({
  neutral: 'text-[var(--text-primary)]',
  danger: 'text-[var(--danger-text)]',
});

export function EntryStatePanel({
  tone = 'neutral',
  visual,
  title,
  titleId,
  role = 'status',
  busy = false,
  children,
  actions,
}) {
  return (
    <section
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      aria-busy={busy}
      aria-labelledby={titleId}
      className={`flex w-full flex-col items-center gap-[var(--space-5)] rounded-[var(--radius-2xl)] border px-[var(--space-5)] py-[var(--space-8)] text-center shadow-[var(--shadow-sm)] md:px-[var(--space-8)] ${TONE_CLASS[tone] ?? TONE_CLASS.neutral}`}
    >
      <div className="flex min-h-[68px] items-center justify-center">
        {visual}
      </div>

      <div className="flex flex-col gap-[var(--space-2)]">
        <h1
          id={titleId}
          className={`m-0 text-[length:var(--font-size-2xl)] font-extrabold leading-tight ${TITLE_TONE_CLASS[tone] ?? TITLE_TONE_CLASS.neutral}`}
        >
          {title}
        </h1>

        <div className="text-[length:var(--font-size-base)] leading-relaxed text-[var(--text-secondary)]">
          {children}
        </div>
      </div>

      {actions && (
        <div className="flex w-full flex-col gap-[var(--space-3)] sm:w-auto sm:flex-row">
          {actions}
        </div>
      )}
    </section>
  );
}
