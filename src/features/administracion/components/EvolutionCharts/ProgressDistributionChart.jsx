import {
  COUNT_FORMAT,
  NO_DATA,
  chartMinWidth,
  LEVEL_STYLE,
} from './chartFormat.js';
import { UnitAxis } from './UnitAxis.jsx';

const BAR_AREA = 150;

/*
 * Barras agrupadas por unidad temporal (RF-141): una barra por nivel de
 * progreso con la cantidad original encima. La altura solo compara
 * visualmente las cantidades (respecto a la mayor de la serie); no se
 * calculan porcentajes, totales ni promedios. Una unidad sin
 * distribución se marca «Sin datos» (no como ceros) y un nivel ausente
 * dentro de una distribución se marca «s/d».
 */
export function ProgressDistributionChart({ units }) {
  const largest = Math.max(
    0,
    ...units.flatMap(({ distribution }) =>
      (distribution ?? []).map(({ users }) => users ?? 0),
    ),
  );

  return (
    <figure className="m-0 flex flex-col gap-[var(--space-3)]">
      <figcaption className="flex flex-col gap-[var(--space-2)]">
        <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
          Eje horizontal: unidades del cronograma. Cada barra es la cantidad de
          participantes en un nivel de progreso.
        </span>
        <span className="flex flex-wrap gap-x-[var(--space-4)] gap-y-[var(--space-1)]">
          {Object.entries(LEVEL_STYLE).map(
            ([level, { label, short, color }]) => (
              <span
                key={level}
                className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]"
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-[10px] w-[10px] rounded-[2px] ${color}`}
                />
                <span className="font-bold">{short}</span> {label}
              </span>
            ),
          )}
        </span>
      </figcaption>

      <div className="min-w-0 overflow-x-auto overflow-y-hidden">
        <div style={{ minWidth: chartMinWidth(units.length, 108) }}>
          <div
            aria-hidden="true"
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${units.length}, minmax(0, 1fr))`,
            }}
          >
            {units.map(({ id, distribution }) =>
              distribution === null ? (
                <span
                  key={id}
                  data-gap
                  className="mx-[var(--space-1)] flex items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--surface-border)] bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,var(--surface-hover)_4px,var(--surface-hover)_8px)] text-[11px] font-bold text-[var(--text-muted)]"
                  style={{ height: BAR_AREA + 34 }}
                >
                  {NO_DATA}
                </span>
              ) : (
                <span
                  key={id}
                  className="flex items-end justify-center gap-[3px] px-[var(--space-1)]"
                >
                  {distribution.map(({ level, users }) => (
                    <span
                      key={level}
                      className="flex w-full max-w-[20px] flex-col items-center gap-[2px]"
                    >
                      <span className="text-[10px] font-bold text-[var(--text-primary)] tabular-nums">
                        {users === null ? 's/d' : COUNT_FORMAT.format(users)}
                      </span>
                      <span
                        className="flex w-full items-end"
                        style={{ height: BAR_AREA }}
                      >
                        {users !== null && largest > 0 && (
                          <span
                            data-bar={level}
                            className={`block w-full origin-bottom rounded-t-[3px] transition-transform duration-500 ease-out motion-reduce:transition-none starting:scale-y-0 ${LEVEL_STYLE[level].color}`}
                            style={{ height: `${(users / largest) * 100}%` }}
                          />
                        )}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">
                        {LEVEL_STYLE[level].short}
                      </span>
                    </span>
                  ))}
                </span>
              ),
            )}
          </div>
          <UnitAxis units={units} />
        </div>
      </div>

      {/* Cantidades exactas para lectores de pantalla. */}
      <ul className="sr-only">
        {units.map(({ id, label, distribution }) => (
          <li key={id}>
            {label}:{' '}
            {distribution === null
              ? NO_DATA
              : distribution
                  .map(
                    ({ level, users }) =>
                      `${LEVEL_STYLE[level].label} ${
                        users === null ? NO_DATA : COUNT_FORMAT.format(users)
                      }`,
                  )
                  .join(', ')}
          </li>
        ))}
      </ul>
    </figure>
  );
}
