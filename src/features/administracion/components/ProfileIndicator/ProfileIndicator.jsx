import { INDICATOR_STATE } from '../../types/participantTracking.js';

/*
 * Indicador principal de la ficha (RF-128): progreso o adherencia, tal
 * como lo reporta M05. Muestra el número recibido SIN convertirlo a
 * porcentaje ni añadir unidades, porque el contrato aún no las confirma.
 * «No calculable» y «No disponible» se distinguen siempre con texto.
 */
const NUMBER = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

const STATE_LABEL = Object.freeze({
  [INDICATOR_STATE.NOT_AVAILABLE]: 'No disponible',
  [INDICATOR_STATE.NOT_CALCULABLE]: 'No calculable',
});

export function ProfileIndicator({ icon: Icon, label, description, indicator }) {
  const available = indicator?.state === INDICATOR_STATE.AVAILABLE;

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
              ? 'text-[length:var(--font-size-3xl)] leading-[var(--line-height-tight)] font-extrabold text-[var(--text-primary)] tabular-nums'
              : 'text-[length:var(--font-size-lg)] font-bold text-[var(--text-secondary)]'
          }
        >
          {available ? NUMBER.format(indicator.value) : STATE_LABEL[indicator?.state] ?? STATE_LABEL[INDICATOR_STATE.NOT_AVAILABLE]}
        </span>
        <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">{description}</span>
      </dd>
    </div>
  );
}
