import { Link } from 'react-router-dom';
import { ArrowRight, MoonStar, Siren, Waves } from 'lucide-react';

import { StaleBadge } from '../StaleDataNotice/index.js';

import { MiniStat } from './MiniStat.jsx';

const COUNT_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

/*
 * Widget principal del panel (RF-140): total de alertas críticas
 * pendientes, el elemento más destacado de la pantalla. El total lo
 * calcula services/cohortDashboard.js (suma de inactividad y craving de
 * RF-132); aquí solo se presenta, junto al desglose tal como llega de la
 * vista conductual. Sin colores de alarma: un total mayor que cero solo
 * refuerza el borde. Un total desconocido es «No disponible», nunca 0.
 */
export function CriticalAlertsCard({
  total,
  inactivity = null,
  craving = null,
  isStale,
  isLoading,
  detailPath,
}) {
  const hasPending = Number.isInteger(total) && total > 0;
  const frame = hasPending
    ? 'border-2 border-[var(--warning-border)]'
    : 'border border-[var(--surface-border)]';

  return (
    <section
      aria-labelledby="alertas-criticas-titulo"
      aria-busy={isLoading}
      className={`grid gap-[var(--space-4)] rounded-[var(--radius-xl)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] transition duration-300 ease-out motion-reduce:transition-none starting:translate-y-1 starting:opacity-0 sm:p-[var(--space-5)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:gap-[var(--space-6)] ${frame}`}
    >
      <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
        <h2
          id="alertas-criticas-titulo"
          className="m-0 inline-flex flex-wrap items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]"
        >
          <span className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-700)]">
            <Siren size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          Alertas críticas pendientes
          {isStale && <StaleBadge />}
        </h2>

        <p className="m-0" data-critical-total>
          {isLoading ? (
            <span className="text-[length:var(--font-size-md)] font-bold text-[var(--text-muted)]">
              Cargando...
            </span>
          ) : total === null ? (
            <span className="text-[length:var(--font-size-xl)] font-extrabold text-[var(--text-secondary)]">
              No disponible
            </span>
          ) : (
            <span className="text-[length:var(--font-size-4xl)] leading-none font-extrabold text-[var(--text-primary)] tabular-nums">
              {COUNT_FORMAT.format(total)}
            </span>
          )}
        </p>

        <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Suma de las alertas de inactividad y de craving elevado pendientes,
          según la vista conductual.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-[var(--space-3)]">
        {!isLoading && (
          <dl className="m-0 grid grid-cols-1 gap-[var(--space-2)] min-[420px]:grid-cols-2">
            <MiniStat
              label="Alertas de inactividad"
              icon={MoonStar}
              value={inactivity}
            />
            <MiniStat
              label="Alertas de craving elevado"
              icon={Waves}
              value={craving}
            />
          </dl>
        )}

        {!isLoading && isStale && (
          <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--warning-text)]">
            El total proviene de datos desactualizados de la vista conductual.
          </p>
        )}

        {!isLoading && total === null && (
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-muted)]">
            La vista conductual no entregó las dos cantidades de alertas; el
            total no se muestra para no informar un valor incorrecto.
          </p>
        )}

        <Link
          to={detailPath}
          className="inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline hover:underline"
        >
          Ver el detalle en la vista conductual
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
