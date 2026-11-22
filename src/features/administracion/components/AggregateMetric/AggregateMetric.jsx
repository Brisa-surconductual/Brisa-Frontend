/*
 * Un indicador de la vista agregada (RF-132). Solo presenta lo que
 * recibe: un cero real se muestra como 0 y un dato ausente (null) como
 * «No disponible». Nunca completa, redondea a otra escala ni convierte
 * valores. `emphasis` destaca el valor con borde y peso, no solo con
 * color, y siempre acompaña al texto del indicador.
 */
export function AggregateMetric({
  label,
  value,
  format,
  description,
  emphasis = false,
  icon: Icon,
}) {
  const frame = emphasis
    ? 'border-2 border-[var(--warning-border)] bg-[var(--warning-bg)]'
    : 'border border-[var(--surface-border)] bg-[var(--surface-card)]';
  const labelColor = emphasis
    ? 'text-[var(--warning-text)]'
    : 'text-[var(--text-secondary)]';

  return (
    <div
      className={`flex min-w-0 flex-col gap-[var(--space-1)] rounded-[var(--radius-lg)] px-[var(--space-4)] py-[var(--space-3)] ${frame}`}
    >
      <dt
        className={`inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold ${labelColor}`}
      >
        {Icon && (
          <Icon
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />
        )}
        {label}
      </dt>
      <dd className="m-0 flex flex-col gap-[var(--space-1)]">
        {value === null || value === undefined ? (
          <span className="text-[length:var(--font-size-md)] font-bold text-[var(--text-secondary)]">
            No disponible
          </span>
        ) : (
          <span className="text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold text-[var(--text-primary)] tabular-nums">
            {format.format(value)}
          </span>
        )}
        {description && (
          <span className="text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-muted)]">
            {description}
          </span>
        )}
      </dd>
    </div>
  );
}
