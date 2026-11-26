/*
 * Indicador principal de la ficha (RF-128): progreso o adherencia, tal
 * como lo reporta M05. Recibe el valor ya formateado (nivel como
 * categoría, adherencia en %) o `null` si no está disponible, y un dato
 * complementario opcional (unidades completadas, días con registro). No
 * calcula ni infiere indicadores.
 */
export function ProfileIndicator({ icon: Icon, label, value, detail = null, description }) {
  const available = value !== null && value !== undefined;

  return (
    <div className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
      <dt className="inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
        {Icon && <Icon size={18} strokeWidth={1.8} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="m-0 flex flex-col gap-[var(--space-1)]">
        <span
          className={
            available
              ? 'text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold text-[var(--text-primary)] tabular-nums'
              : 'text-[length:var(--font-size-lg)] font-bold text-[var(--text-secondary)]'
          }
        >
          {available ? value : 'No disponible'}
        </span>
        {detail && <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">{detail}</span>}
        <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">{description}</span>
      </dd>
    </div>
  );
}
