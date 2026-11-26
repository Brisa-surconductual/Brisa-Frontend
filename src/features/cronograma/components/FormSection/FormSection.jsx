/*
 * Tarjeta de sección de formulario con título h2 propio. `step`
 * numera los pasos cuando la pantalla es secuencial.
 */
export function FormSection({
  id,
  step,
  icon: Icon,
  title,
  description,
  as: Tag = 'section',
  children,
}) {
  const titleId = `${id}-titulo`;

  return (
    <Tag
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-[var(--space-5)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
    >
      <div className="flex items-start gap-[var(--space-3)]">
        {step ? (
          <span
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--brand-50)] text-[length:var(--font-size-sm)] font-extrabold text-[var(--brand-700)] tabular-nums"
            aria-hidden="true"
          >
            {step}
          </span>
        ) : (
          Icon && (
            <span
              className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
              aria-hidden="true"
            >
              <Icon size={18} strokeWidth={1.8} />
            </span>
          )
        )}

        <div className="min-w-0">
          <h2
            id={titleId}
            className="m-0 text-[length:var(--font-size-lg)] leading-[var(--line-height-snug)] font-extrabold text-[var(--text-primary)]"
          >
            {step && <span className="sr-only">Paso {step}: </span>}
            {title}
          </h2>

          {description && (
            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </Tag>
  );
}
