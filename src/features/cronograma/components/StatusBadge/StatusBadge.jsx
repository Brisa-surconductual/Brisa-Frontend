const TONE_CLASS = Object.freeze({
  brand: 'bg-[var(--brand-100)] text-[var(--brand-700)]',
  success: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
  info: 'bg-[var(--info-bg)] text-[var(--info-text)]',
  neutral: 'bg-[var(--neutral-100)] text-[var(--text-muted)]',
});

/**
 * Etiqueta de estado.
 *
 * Recibe el tono ya resuelto en vez del status: así sirve a los cuatro enums
 * del cronograma (contenido, unidad temporal, participante y pausa) sin
 * depender de ninguno. Cada contenedor resuelve su propio mapa de tonos.
 *
 * El color nunca comunica el estado por sí solo: sin `label` no se renderiza.
 */
export function StatusBadge({ tone = 'neutral', label }) {
  if (!label) {
    return null;
  }

  return (
    <span
      className={`inline-block rounded-[var(--radius-full)] px-[var(--space-3)] py-[var(--space-1)] text-[10px] font-extrabold tracking-[0.03em] uppercase ${
        TONE_CLASS[tone] ?? TONE_CLASS.neutral
      }`}
    >
      {label}
    </span>
  );
}
