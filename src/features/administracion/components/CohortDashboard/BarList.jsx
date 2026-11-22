const COUNT_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

/*
 * Barras horizontales compactas del panel (RF-140). Cada fila muestra la
 * etiqueta y la cantidad ORIGINAL; la longitud de la barra solo compara
 * visualmente las cantidades de la lista (relativa a la mayor) y no se
 * presenta como cifra, porcentaje ni total. Una cantidad ausente (null)
 * se muestra como «No disponible» y no dibuja barra; un cero real dibuja
 * una barra vacía. La barra crece al aparecer, salvo con movimiento
 * reducido.
 */
export function BarList({ label, items }) {
  const largest = Math.max(
    0,
    ...items.map(({ value }) => (Number.isInteger(value) ? value : 0)),
  );

  return (
    <ul
      aria-label={label}
      className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0"
    >
      {items.map(({ key, label: itemLabel, value }) => {
        const known = Number.isInteger(value);

        return (
          <li
            key={key}
            className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)_auto] items-center gap-[var(--space-3)]"
          >
            <span className="text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
              {itemLabel}
            </span>

            <span
              aria-hidden="true"
              data-bar
              className={`block h-[10px] overflow-hidden rounded-[var(--radius-full)] ${
                known
                  ? 'bg-[var(--brand-50)]'
                  : 'border border-dashed border-[var(--surface-border)] bg-transparent'
              }`}
            >
              {known && largest > 0 && (
                <span
                  className="block h-full origin-left rounded-[var(--radius-full)] bg-[var(--brand-500)] transition-transform duration-500 ease-out motion-reduce:transition-none starting:scale-x-0"
                  style={{ width: `${(value / largest) * 100}%` }}
                />
              )}
            </span>

            <span
              className={`text-right tabular-nums ${
                known
                  ? 'text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]'
                  : 'text-[length:var(--font-size-xs)] font-bold text-[var(--text-muted)]'
              }`}
            >
              {known ? COUNT_FORMAT.format(value) : 'No disponible'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
