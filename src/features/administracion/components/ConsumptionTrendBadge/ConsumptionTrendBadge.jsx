import { CircleDashed, CircleHelp, MoveRight, TrendingDown, TrendingUp } from 'lucide-react';

import { TRACKING_TREND } from '../../types/participantTracking.js';

/*
 * Tendencia de consumo (RF-128; definiciones en RF-73). Tono NEUTRO para
 * todos los valores: el color no valora la tendencia ni aporta una
 * interpretación clínica que el requisito no hace. Texto e ícono siempre.
 * Un valor fuera del enumerado se muestra tal cual, sin interpretarlo.
 */
const TREND_PRESENTATION = Object.freeze({
  [TRACKING_TREND.REDUCTION]: Object.freeze({ label: 'Reducción', Icon: TrendingDown }),
  [TRACKING_TREND.STABLE]: Object.freeze({ label: 'Estable', Icon: MoveRight }),
  [TRACKING_TREND.INCREASE]: Object.freeze({ label: 'Incremento', Icon: TrendingUp }),
  [TRACKING_TREND.NOT_CALCULATED]: Object.freeze({ label: 'No calculada', Icon: CircleDashed }),
});

export function ConsumptionTrendBadge({ trend }) {
  const presentation = TREND_PRESENTATION[trend];
  const Icon = presentation?.Icon ?? CircleHelp;
  let label = presentation?.label;

  if (!label) label = trend ? `Valor no reconocido: ${trend}` : 'No disponible';

  return (
    <span className="inline-flex w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-md)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
      <Icon size={18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
