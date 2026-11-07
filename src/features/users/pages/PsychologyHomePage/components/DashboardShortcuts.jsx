import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  CalendarRange,
  MessagesSquare,
  Route,
} from 'lucide-react';

import { DASHBOARD_SHORTCUTS } from '../data/psychologyStats.js';

const SHORTCUT_ICON = Object.freeze({
  CRONOGRAMAS: CalendarRange,
  PROGRESO: Route,
  CONTENIDOS: BookOpenText,
  CHAT: MessagesSquare,
});

/* Accesos a tareas frecuentes; solo rutas existentes. */
export function DashboardShortcuts() {
  return (
    <section aria-labelledby="accesos-titulo" className="flex flex-col gap-[var(--space-4)]">
      <h2
        id="accesos-titulo"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        Accesos de gestión
      </h2>

      <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-3)] p-0 md:grid-cols-2">
        {DASHBOARD_SHORTCUTS.map(({ id, title, description, to, status }) => {
          const Icon = SHORTCUT_ICON[id];

          return (
            <li key={id} className="flex">
              <Link
                to={to}
                className="group flex min-h-[44px] flex-1 items-start gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] no-underline transition-colors duration-150 hover:border-[var(--brand-400)] hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
              >
                <span
                  className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                  aria-hidden="true"
                >
                  <Icon size={20} strokeWidth={1.8} />
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
                  <span className="flex flex-wrap items-center gap-[var(--space-2)]">
                    <span className="text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">
                      {title}
                    </span>

                    {status && (
                      <span className="rounded-[var(--radius-full)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--warning-text)]">
                        {status}
                      </span>
                    )}
                  </span>

                  <span className="text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
                    {description}
                  </span>
                </span>

                <ArrowRight
                  size={18}
                  strokeWidth={1.8}
                  className="mt-[2px] shrink-0 text-[var(--text-muted)] transition-transform duration-150 group-hover:translate-x-[2px] group-hover:text-[var(--brand-600)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
