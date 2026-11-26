/*
 * Sección del formulario de línea base: un fieldset con leyenda
 * (ícono, título y descripción) que agrupa sus preguntas.
 */
export function BaselineSection({
  id,
  icon,
  title,
  description,
  children,
}) {
  return (
    <fieldset
      id={id}
      className="m-0 flex min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)] max-[370px]:p-[var(--space-4)]"
    >
      <legend className="float-left mb-[var(--space-2)] flex w-full items-center gap-[var(--space-3)] border-b border-[var(--surface-border)] p-0 pb-[var(--space-4)]">
        <span className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]" aria-hidden="true">
          {icon}
        </span>

        <span className="flex min-w-0 flex-col">
          <strong className="text-[length:var(--font-size-base)] font-extrabold text-[var(--text-primary)]">
            {title}
          </strong>

          <small className="mt-[2px] text-[length:var(--font-size-xs)] font-medium text-[var(--text-secondary)]">
            {description}
          </small>
        </span>
      </legend>

      <div className="clear-both flex flex-col gap-[var(--space-4)]">
        {children}
      </div>
    </fieldset>
  );
}
