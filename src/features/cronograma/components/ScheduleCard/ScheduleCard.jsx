import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Layers } from 'lucide-react';

import { ScheduleStatusBadge } from '../ScheduleStatusBadge/index.js';

/*
 * Tarjeta de cronograma. El acceso al panel es un enlace real
 * (teclado y lector de pantalla) que se extiende a toda la
 * tarjeta con un pseudo-elemento: sin interactivos anidados.
 * Conserva el `state` de navegación ({ schedule }).
 */
export function ScheduleCard({ schedule, panelPath }) {
  const nombre = schedule.nombreCronograma || 'Sin nombre';
  const fecha = schedule.fechaCreacion
    ? schedule.fechaCreacion.split('T')[0]
    : null;

  return (
    <article className="group relative flex min-h-[168px] flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--brand-500)] hover:border-[var(--brand-400)] hover:shadow-[var(--shadow-md)] motion-reduce:transition-none">
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <h3 className="m-0 min-w-0 text-[length:var(--font-size-lg)] leading-[var(--line-height-snug)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          {nombre}
        </h3>

        <ScheduleStatusBadge status={schedule.estado} />
      </div>

      <dl className="m-0 flex flex-col gap-[var(--space-2)] text-[length:var(--font-size-sm)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
            <Layers size={16} strokeWidth={1.8} aria-hidden="true" />
            Tipo
          </dt>
          <dd className="m-0 font-semibold text-[var(--text-secondary)]">
            {schedule.esBase ? 'Cronograma base' : 'Cronograma estándar'}
          </dd>
        </div>

        <div className="flex items-center gap-[var(--space-2)]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
            <CalendarDays size={16} strokeWidth={1.8} aria-hidden="true" />
            Creado
          </dt>
          <dd className="m-0 font-semibold text-[var(--text-secondary)] tabular-nums">
            {fecha ?? 'Sin fecha'}
          </dd>
        </div>
      </dl>

      <Link
        to={panelPath}
        state={{ schedule }}
        className="mt-auto inline-flex w-fit items-center rounded-[var(--radius-sm)] text-[length:var(--font-size-sm)] font-bold no-underline after:absolute after:inset-0 after:rounded-[var(--radius-xl)] after:content-['']"
      >
        {/*
         * El color va en el span: globals.css fija `a { color: inherit }`
         * fuera de capa y anula las utilidades de color sobre <a>.
         */}
        <span className="inline-flex items-center gap-[var(--space-2)] text-[var(--brand-600)]">
          Ver panel de gestión
          <span className="sr-only"> de {nombre}</span>
          <ArrowRight
            size={16}
            strokeWidth={2}
            className="transition-transform duration-150 group-hover:translate-x-[2px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            aria-hidden="true"
          />
        </span>
      </Link>
    </article>
  );
}
