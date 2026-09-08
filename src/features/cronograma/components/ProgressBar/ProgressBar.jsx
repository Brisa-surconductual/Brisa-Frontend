import { toProgressPercent } from '@/features/cronograma/utils/progressUtils.js';

/**
 * Barra de progreso con su fila de etiqueta, como en la pantalla de inicio
 * del participante ("Progreso semanal · 2 / 7 días").
 *
 * Al llegar al 100 % el relleno pasa a color de éxito, igual que el
 * `.prog-fill.full` del prototipo.
 */
export function ProgressBar({
  value,
  max = 100,
  label = 'Progreso',
  valueText,
  unitLabel,
}) {
  const percent = toProgressPercent(value, max);

  // Solo se muestra "2 / 7" cuando los números son coherentes. Si no, el texto
  // (que además es el aria-valuetext) contradiría al aria-valuenow y al ancho
  // de la barra: "5 / 0" con la barra al 0 %, o "15 / 10" con la barra al 100 %.
  const hasCoherentValues =
    Number.isFinite(value) &&
    Number.isFinite(max) &&
    max > 0 &&
    value >= 0 &&
    value <= max;

  const defaultValueText = hasCoherentValues
    ? `${value} / ${max}${unitLabel ? ` ${unitLabel}` : ''}`
    : `${percent}%`;

  const text = valueText ?? defaultValueText;

  return (
    <div>
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <span className="text-[11px] text-[var(--text-muted)]">{label}</span>

        <span className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--brand-600)]">
          {text}
        </span>
      </div>

      <div
        className="mt-[var(--space-2)] h-[6px] w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-hover)]"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={text}
      >
        <div
          className={`h-full rounded-[var(--radius-full)] transition-[width] duration-400 motion-reduce:transition-none ${
            percent === 100 ? 'bg-[var(--success)]' : 'bg-[var(--brand-500)]'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
