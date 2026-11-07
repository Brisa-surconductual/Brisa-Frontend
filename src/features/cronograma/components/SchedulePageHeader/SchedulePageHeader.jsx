/*
 * Encabezado de las pantallas de cronogramas: antetítulo, único
 * h1 de la página, descripción y, opcionalmente, metadatos y
 * acciones. No es un <header> de página: el layout ya tiene uno.
 */
export function SchedulePageHeader({
  eyebrow,
  title,
  description,
  badge,
  children,
  actions,
}) {
  return (
    <div className="flex flex-col gap-[var(--space-5)] lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
        {eyebrow && (
          <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
            {eyebrow}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-[var(--space-3)]">
          <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
            {title}
          </h1>

          {badge}
        </div>

        {description && (
          <p className="m-0 max-w-[680px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
            {description}
          </p>
        )}

        {children}
      </div>

      {actions && (
        <div className="flex flex-col gap-[var(--space-3)] sm:flex-row lg:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
