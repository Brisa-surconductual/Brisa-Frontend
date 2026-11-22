// Sin redondear ni convertir: el valor se muestra con los decimales que trae.
const RATE_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 20,
});

/*
 * Indicador circular de una tasa de notificaciones (RF-134 en el panel
 * RF-140). Las tasas son proporciones (RF-100), así que el arco se
 * dibuja sobre la escala 0 a 1 SOLO si el valor recibido está en ella.
 * El valor original completo siempre es visible (p. ej. 0,5825), sin
 * porcentaje. Un valor ausente o no calculable no dibuja arco (anillo
 * punteado) y se muestra como «No disponible», nunca como cero. Un valor
 * fuera de 0 a 1 se muestra sin arco. El arco crece al aparecer, salvo
 * con movimiento reducido. Debe usarse dentro de un <dl>.
 *
 * Es una mini tarjeta de solo lectura (texto estático, sin controles):
 * el anillo no se encoge y el valor va siempre en una sola línea, sin
 * partir dígitos. Si el valor no cabe junto al anillo, el bloque de texto
 * baja completo a la línea siguiente (flex-wrap). No se usa overflow
 * auto: con interlineado ajustado generaba una barra de desplazamiento
 * vertical diminuta, cuyos botones parecían flechas de incremento.
 */
export function RateGauge({ label, value }) {
  const known = typeof value === 'number' && Number.isFinite(value);
  const inScale = known && value >= 0 && value <= 1;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--surface-bg)] px-[var(--space-3)] py-[var(--space-3)]">
      <svg
        viewBox="0 0 36 36"
        aria-hidden="true"
        data-gauge={inScale ? 'scale' : 'none'}
        className="h-[56px] w-[56px] shrink-0 -rotate-90"
      >
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke={known ? 'var(--brand-50)' : 'var(--surface-border)'}
          strokeWidth="4"
          strokeDasharray={known ? undefined : '2 3'}
        />
        {inScale && (
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="var(--brand-500)"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - value * 100}
            className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none starting:[stroke-dashoffset:100]"
          />
        )}
      </svg>

      <div className="flex flex-1 flex-col gap-[var(--space-1)]">
        <dt className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
          {label}
        </dt>
        <dd className="m-0">
          {known ? (
            <span
              data-rate-value
              className="block text-[length:var(--font-size-xl)] leading-[var(--line-height-tight)] font-extrabold whitespace-nowrap text-[var(--text-primary)] tabular-nums"
            >
              {RATE_FORMAT.format(value)}
            </span>
          ) : (
            <span className="text-[length:var(--font-size-md)] font-bold text-[var(--text-secondary)]">
              No disponible
            </span>
          )}
          {known && !inScale && (
            <span className="mt-[var(--space-1)] block text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
              Valor fuera de la escala 0 a 1: se muestra sin indicador.
            </span>
          )}
        </dd>
      </div>
    </div>
  );
}
