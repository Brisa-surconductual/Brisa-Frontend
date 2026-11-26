import { AlertTriangle, CalendarRange } from 'lucide-react';

import { describirProgramacion } from '../../services/contenidosAdmin.js';

/*
 * RF-25 / RF-24: dónde está programado el contenido de un nodo. Una fila por
 * cronograma: cronograma, unidad temporal, rango de fechas de la unidad y
 * ventana de disponibilidad. Son fechas de la PLANTILLA del cronograma: cada
 * estudiante las recorre desde su propia fecha de inicio (RF-17 / RF-22),
 * descontando pausas. La tarjeta del nodo usa `ContenidoAsociadoResumen`.
 */
export function ContenidoProgramacion({ programaciones }) {
  if (!programaciones || programaciones.length === 0) {
    return (
      <p className="m-0 inline-flex items-start gap-[var(--space-1)] text-[length:var(--font-size-xs)] text-[var(--warning-text)]">
        <AlertTriangle
          size={14}
          strokeWidth={1.8}
          aria-hidden="true"
          className="mt-[2px] shrink-0"
        />
        Este contenido no está programado en ningún cronograma: no bloqueará a
        nadie.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <ul
        aria-label="Cronogramas donde está programado este contenido"
        className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0"
      >
        {programaciones.map((p) => {
          const d = describirProgramacion(p);
          return (
            <li
              key={p.id}
              className="flex items-start gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)]"
            >
              <CalendarRange
                size={18}
                strokeWidth={1.8}
                aria-hidden="true"
                className="mt-[2px] shrink-0 text-[var(--brand-600)]"
              />
              <span className="flex min-w-0 flex-col [overflow-wrap:anywhere]">
                <span className="font-bold text-[var(--text-primary)]">
                  {d.cronograma}
                </span>
                <span className="text-[var(--text-primary)]">{d.unidad}</span>
                {d.fechas && (
                  <span className="text-[var(--text-secondary)]">
                    Unidad: {d.fechas}
                  </span>
                )}
                {d.disponibilidad && (
                  <span className="text-[var(--text-secondary)]">
                    {d.disponibilidad}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
        Fechas de la plantilla del cronograma: cada estudiante las recorre desde
        su propia fecha de inicio.
      </p>
    </div>
  );
}
