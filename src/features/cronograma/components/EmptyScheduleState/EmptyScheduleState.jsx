export function EmptyScheduleState({
  title = 'No hay unidades para mostrar',
  description = 'No se encontraron unidades del cronograma con los criterios seleccionados.',
}) {
  return (
    <section
      className="rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-8)] text-center"
      aria-live="polite"
    >
      <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
        {title}
      </h2>

      <p className="mx-auto mt-[var(--space-2)] mb-0 max-w-[520px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
        {description}
      </p>
    </section>
  );
}