import { AlertTriangle, CalendarRange, Link2 } from 'lucide-react';

import { describirProgramacion } from '../../services/contenidosAdmin.js';

function Campo({ etiqueta, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-[var(--space-2)] max-[420px]:grid-cols-1">
      <dt className="text-[var(--text-secondary)]">{etiqueta}</dt>
      <dd className="m-0 font-semibold text-[var(--text-primary)] [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
}

/*
 * RF-25 / RF-24: resumen del contenido de un nodo en su tarjeta. Muestra con
 * rótulos explícitos el nombre del contenido y, por cada cronograma donde está
 * programado, el cronograma, la unidad temporal y sus fechas. Son fechas de
 * la plantilla: cada estudiante las recorre desde su propia fecha de inicio.
 */
export function ContenidoAsociadoResumen({ contenido }) {
  const programaciones = contenido?.programaciones ?? [];

  return (
    <section
      aria-label="Contenido asociado"
      className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-3)] text-[length:var(--font-size-xs)]"
    >
      <p className="m-0 inline-flex items-center gap-[var(--space-1)] font-bold text-[var(--text-secondary)]">
        <Link2 size={14} strokeWidth={1.8} aria-hidden="true" />
        Contenido asociado
      </p>

      <dl className="m-0 flex flex-col gap-[var(--space-1)]">
        <Campo etiqueta="Contenido">
          {contenido ? contenido.nombre : 'No se encontró en el catálogo'}
        </Campo>
      </dl>

      {contenido && programaciones.length === 0 && (
        <p className="m-0 inline-flex items-start gap-[var(--space-1)] text-[var(--warning-text)]">
          <AlertTriangle
            size={14}
            strokeWidth={1.8}
            aria-hidden="true"
            className="mt-[2px] shrink-0"
          />
          No está programado en ningún cronograma: no bloqueará a nadie.
        </p>
      )}

      {programaciones.length > 0 && (
        <ul
          aria-label="Cronogramas y unidades temporales del contenido"
          className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0"
        >
          {programaciones.map((p) => {
            const d = describirProgramacion(p);
            return (
              <li
                key={p.id}
                className="flex items-start gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-2)]"
              >
                <CalendarRange
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="mt-[2px] shrink-0 text-[var(--brand-600)]"
                />
                <dl className="m-0 flex min-w-0 flex-1 flex-col gap-[2px]">
                  <Campo etiqueta="Cronograma">{d.cronograma}</Campo>
                  <Campo etiqueta="Unidad temporal">{d.unidad}</Campo>
                  {d.fechas && (
                    <Campo etiqueta="Fechas de la unidad">{d.fechas}</Campo>
                  )}
                  {d.disponibilidad && (
                    <Campo etiqueta="Disponibilidad">
                      {d.disponibilidad.replace(/^Disponible: /, '')}
                    </Campo>
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
      )}

      {programaciones.length > 0 && (
        <p className="m-0 text-[var(--text-secondary)]">
          Fechas de la plantilla: cada estudiante las recorre desde su propia
          fecha de inicio.
        </p>
      )}
    </section>
  );
}
