/*
 * Eje horizontal de los gráficos de evolución (RF-141): una columna por
 * unidad temporal, en el orden oficial del cronograma (RF-55), con la
 * etiqueta del catálogo. Las unidades sin datos consolidados se señalan
 * con texto, no solo con estilo. Decorativo para lectores de pantalla:
 * los valores se anuncian en la lista accesible de cada gráfico.
 */
export function UnitAxis({ units }) {
  return (
    <div
      aria-hidden="true"
      className="grid border-t border-[var(--surface-border)] pt-[var(--space-2)]"
      style={{ gridTemplateColumns: `repeat(${units.length}, minmax(0, 1fr))` }}
    >
      {units.map(({ id, label, insufficient }) => (
        <span
          key={id}
          className="flex flex-col items-center gap-[2px] px-[2px] text-center"
        >
          <span className="text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]">
            {label}
          </span>
          {insufficient && (
            <span className="text-[10px] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
              Sin datos
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
