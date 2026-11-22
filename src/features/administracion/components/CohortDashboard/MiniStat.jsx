const COUNT_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

/*
 * Cifra compacta del panel (RF-140). Presenta la cantidad original: un
 * cero real es 0 y un dato ausente (null) es «No disponible». Debe usarse
 * dentro de un <dl>. `format` permite otra presentación sin redondear.
 */
export function MiniStat({ label, value, icon: Icon, format = COUNT_FORMAT }) {
  const known = typeof value === 'number' && Number.isFinite(value);

  return (
    <div className="flex min-w-0 flex-col gap-[2px] rounded-[var(--radius-md)] bg-[var(--surface-bg)] px-[var(--space-3)] py-[var(--space-2)]">
      <dt className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]">
        {Icon && (
          <Icon
            size={14}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />
        )}
        {label}
      </dt>
      <dd className="m-0">
        {known ? (
          <span className="text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)] tabular-nums">
            {format.format(value)}
          </span>
        ) : (
          <span className="text-[length:var(--font-size-sm)] font-bold text-[var(--text-muted)]">
            No disponible
          </span>
        )}
      </dd>
    </div>
  );
}
