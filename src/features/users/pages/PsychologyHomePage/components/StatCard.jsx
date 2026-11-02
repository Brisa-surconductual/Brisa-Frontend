/*
 * Indicador agregado del dashboard. Distingue sin ambigüedad:
 * - cargando: esqueleto, nunca una cifra ni un cero;
 * - cero real: "0";
 * - dato ausente (null): "—" y "Sin dato";
 * - error de consulta: "—" y "No disponible".
 *
 * El tono va en el ícono, no en la cifra: el color no es el
 * único medio de comunicar el indicador.
 */
const TONE_CLASS = Object.freeze({
  brand: 'bg-[var(--brand-50)] text-[var(--brand-700)]',
  success: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
  info: 'bg-[var(--info-bg)] text-[var(--info-text)]',
});

const NUMBER_FORMAT = new Intl.NumberFormat('es-CO');

export function StatCard({ id, label, unit, tone, icon: Icon, value, loading, failed }) {
  const labelId = `indicador-${id}`;
  const hasValue = value !== null && value !== undefined;

  let figure;

  if (loading) {
    figure = (
      <span
        className="block h-[36px] w-[88px] animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-hover)] motion-reduce:animate-none"
        aria-hidden="true"
      />
    );
  } else {
    figure = (
      <p className="m-0 text-[length:var(--font-size-3xl)] leading-[1] md:text-[length:var(--font-size-4xl)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] tabular-nums">
        {hasValue ? NUMBER_FORMAT.format(value) : '—'}
      </p>
    );
  }

  let caption = unit;

  if (!loading && failed) caption = 'No disponible';
  else if (!loading && !hasValue) caption = 'Sin dato';

  return (
    <li className="flex min-w-0 flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:gap-[var(--space-4)] md:p-[var(--space-5)]">
      <div className="flex flex-col items-start gap-[var(--space-2)] md:flex-row md:items-center md:gap-[var(--space-3)]">
        <span
          className={`inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${TONE_CLASS[tone]}`}
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={1.8} />
        </span>

        <h3
          id={labelId}
          className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-snug)] font-bold text-[var(--text-secondary)]"
        >
          {label}
        </h3>
      </div>

      <div className="flex min-h-[44px] flex-col justify-end gap-[var(--space-1)]">
        {figure}

        {/* Altura fija: sin salto al pasar de carga a datos. */}
        <span className="min-h-[18px] text-[length:var(--font-size-xs)] font-medium text-[var(--text-muted)]">
          {loading ? <span className="sr-only">Cargando</span> : caption}
        </span>
      </div>
    </li>
  );
}
