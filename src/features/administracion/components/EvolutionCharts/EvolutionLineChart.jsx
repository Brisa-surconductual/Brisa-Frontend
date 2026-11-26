import { useId } from 'react';

import {
  NO_DATA,
  VALUE_FORMAT,
  chartMinWidth,
  svgId,
  unitCenter,
} from './chartFormat.js';
import { UnitAxis } from './UnitAxis.jsx';

const HEIGHT = 200;
const TOP = 30;
const BOTTOM = 18;

/*
 * Gráfico de líneas de un indicador por unidad temporal (RF-141): un
 * punto por unidad con datos, con su valor original visible. El eje
 * vertical se ajusta a los valores recibidos (no a una escala clínica,
 * que no está definida) y solo muestra los valores mínimo y máximo de la
 * serie como referencia.
 *
 * Una unidad sin datos conserva su posición, se marca con una franja
 * rayada y el texto «Sin datos», y NO se une con línea a sus vecinas: no
 * hay interpolación. Un 0 es un valor real y se dibuja.
 */
export function EvolutionLineChart({ units, valueKey, indicator }) {
  const pattern = `sin-datos-${svgId(useId())}`;
  const count = units.length;
  const values = units.map((unit) => unit[valueKey]);
  const known = values.filter((value) => value !== null);

  const min = known.length ? Math.min(...known) : 0;
  const max = known.length ? Math.max(...known) : 0;
  const span = max - min;
  const pad = span === 0 ? Math.abs(max) * 0.5 || 1 : span * 0.15;
  const low = min - pad;
  const high = max + pad;
  const y = (value) =>
    TOP + (1 - (value - low) / (high - low)) * (HEIGHT - TOP - BOTTOM);

  return (
    <figure className="m-0 flex flex-col gap-[var(--space-3)]">
      <figcaption className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
        Eje horizontal: unidades del cronograma. Eje vertical: valor original de{' '}
        {indicator}, sin escala de referencia confirmada.
      </figcaption>

      {known.length === 0 ? (
        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-muted)]">
          Ninguna unidad de la serie tiene datos de {indicator}.
        </p>
      ) : (
        <div className="flex min-w-0 gap-[var(--space-2)]">
          {/* Referencias del eje vertical: mínimo y máximo de la serie. */}
          <div
            aria-hidden="true"
            className="relative w-[64px] shrink-0"
            style={{ height: HEIGHT }}
          >
            {[...new Set([max, min])].map((value) => (
              <span
                key={value}
                className="absolute right-0 -translate-y-1/2 text-[10px] font-semibold whitespace-nowrap text-[var(--text-muted)] tabular-nums"
                style={{ top: y(value) }}
              >
                {VALUE_FORMAT.format(value)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
            <div style={{ minWidth: chartMinWidth(count, 72) }}>
              <svg
                width="100%"
                height={HEIGHT}
                aria-hidden="true"
                className="block transition-opacity duration-500 ease-out motion-reduce:transition-none starting:opacity-0"
              >
                <defs>
                  <pattern
                    id={pattern}
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="8"
                      stroke="var(--surface-border)"
                      strokeWidth="3"
                    />
                  </pattern>
                </defs>

                {[...new Set([max, min])].map((value) => (
                  <line
                    key={value}
                    x1="0"
                    x2="100%"
                    y1={y(value)}
                    y2={y(value)}
                    stroke="var(--surface-border)"
                    strokeDasharray="4 4"
                  />
                ))}

                {values.map((value, index) =>
                  value === null ? (
                    <g key={units[index].id} data-gap>
                      <rect
                        x={`${(index / count) * 100}%`}
                        width={`${100 / count}%`}
                        y="0"
                        height={HEIGHT}
                        fill={`url(#${pattern})`}
                        opacity="0.6"
                      />
                      <text
                        x={unitCenter(index, count)}
                        y={HEIGHT / 2}
                        textAnchor="middle"
                        className="fill-[var(--text-muted)] text-[11px] font-bold"
                      >
                        {NO_DATA}
                      </text>
                    </g>
                  ) : null,
                )}

                {/* Solo se unen unidades consecutivas con datos. */}
                {values.map((value, index) =>
                  index > 0 && value !== null && values[index - 1] !== null ? (
                    <line
                      key={`segmento-${units[index].id}`}
                      data-segment
                      x1={unitCenter(index - 1, count)}
                      y1={y(values[index - 1])}
                      x2={unitCenter(index, count)}
                      y2={y(value)}
                      stroke="var(--brand-500)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  ) : null,
                )}

                {values.map((value, index) =>
                  value === null ? null : (
                    <g key={`punto-${units[index].id}`} data-point>
                      <circle
                        cx={unitCenter(index, count)}
                        cy={y(value)}
                        r="5"
                        fill="var(--surface-card)"
                        stroke="var(--brand-600)"
                        strokeWidth="2.5"
                      />
                      <text
                        x={unitCenter(index, count)}
                        y={y(value) - 11}
                        textAnchor="middle"
                        className="fill-[var(--text-primary)] text-[11px] font-bold"
                      >
                        {VALUE_FORMAT.format(value)}
                      </text>
                    </g>
                  ),
                )}
              </svg>
              <UnitAxis units={units} />
            </div>
          </div>
        </div>
      )}

      {/* Valores exactos para lectores de pantalla. */}
      <ul className="sr-only">
        {units.map((unit) => (
          <li key={unit.id}>
            {unit.label}:{' '}
            {unit[valueKey] === null
              ? NO_DATA
              : VALUE_FORMAT.format(unit[valueKey])}
          </li>
        ))}
      </ul>
    </figure>
  );
}
