import { UsersRound } from 'lucide-react';

import { PROGRESS_LEVEL } from '../../types/behavioralAggregate.js';

import { BarList } from './BarList.jsx';
import { MiniStat } from './MiniStat.jsx';
import { WidgetExplainer, WidgetGroupTitle } from './WidgetParts.jsx';

const LEVEL_LABEL = Object.freeze({
  [PROGRESS_LEVEL.INITIAL]: 'Inicial',
  [PROGRESS_LEVEL.IN_PROGRESS]: 'En avance',
  [PROGRESS_LEVEL.ADVANCED]: 'Avanzado',
  [PROGRESS_LEVEL.COMPLETED]: 'Completado',
});

// Sin redondear: la adherencia se muestra con los decimales que trae.
const RATE_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 20,
});

/*
 * Resumen compacto de la vista conductual (RF-132) en el panel RF-140.
 * Solo presenta la vista ya interpretada por su servicio. La escala de la
 * adherencia no está confirmada: se muestra su valor original destacado,
 * sin anillo, barra ni escala 0–100. Las alertas van en el widget de
 * alertas críticas, por eso no se repiten aquí.
 */
export function BehavioralSummary({ data }) {
  const adherenceKnown =
    typeof data.averageAdherence === 'number' &&
    Number.isFinite(data.averageAdherence);

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-[var(--space-1)] rounded-[var(--radius-md)] bg-[var(--surface-bg)] px-[var(--space-3)] py-[var(--space-2)]">
          <dt className="text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]">
            Adherencia promedio
          </dt>
          <dd className="m-0">
            {adherenceKnown ? (
              <span className="text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold break-all text-[var(--text-primary)] tabular-nums">
                {RATE_FORMAT.format(data.averageAdherence)}
              </span>
            ) : (
              <span className="text-[length:var(--font-size-sm)] font-bold text-[var(--text-muted)]">
                No disponible
              </span>
            )}
          </dd>
        </div>

        <MiniStat
          label="Participantes activos"
          icon={UsersRound}
          value={data.activeUsers}
        />
      </dl>

      <div className="flex flex-col gap-[var(--space-2)]">
        <WidgetGroupTitle>Distribución por nivel de progreso</WidgetGroupTitle>
        {data.progressDistribution ? (
          <BarList
            label="Participantes por nivel de progreso"
            items={data.progressDistribution.map(({ level, users }) => ({
              key: level,
              label: LEVEL_LABEL[level],
              value: users,
            }))}
          />
        ) : (
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-muted)]">
            Distribución no disponible: no llegó en un formato válido.
          </p>
        )}
      </div>

      <WidgetExplainer summary="Cómo leer la adherencia">
        Es el valor que entrega el módulo de seguimiento, sin conversiones. Su
        escala aún no está confirmada, por eso no se presenta como porcentaje ni
        sobre una barra.
      </WidgetExplainer>
    </div>
  );
}
