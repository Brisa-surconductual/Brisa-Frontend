import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  MessageCircle,
  NotebookPen,
  PawPrint,
  TrendingUp,
} from 'lucide-react';

import {
  STUDENT_MODULE,
  STUDENT_MODULES,
} from '@/features/users/pages/StudentHomePage/data/studentModules.js';

const MODULE_ICON = Object.freeze({
  [STUDENT_MODULE.CHAT]: MessageCircle,
  [STUDENT_MODULE.DIARIO]: NotebookPen,
  [STUDENT_MODULE.PROGRESO]: TrendingUp,
  [STUDENT_MODULE.MASCOTA]: PawPrint,
});

const CARD_BASE_CLASS =
  'flex min-w-0 items-start gap-[var(--space-3)] rounded-[var(--radius-xl)] border bg-[var(--surface-card)] p-[var(--space-4)] min-[480px]:flex-col lg:min-h-[176px]';

/*
 * Módulos con pantalla (`to`): tarjeta que enlaza a su entrada.
 * Módulos aún no construidos: tarjeta informativa, sin enlace,
 * con borde punteado y tono neutro para no competir con lo
 * disponible hoy.
 */
function ModuleCardContent({ name, description, release, Icon, available }) {
  return (
    <>
      <span
        className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${
          available
            ? 'bg-[var(--brand-50)] text-[var(--brand-700)]'
            : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
        }`}
        aria-hidden="true"
      >
        <Icon size={20} strokeWidth={1.7} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)] min-[480px]:w-full">
        <h3 className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">
          {name}
        </h3>

        <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          {description}
        </p>

        <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)] min-[480px]:mt-auto">
          {available ? (
            <span className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-700)]">
              Abrir
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-semibold whitespace-nowrap text-[var(--text-secondary)]">
              <Clock size={13} strokeWidth={2} aria-hidden="true" />
              Disponible próximamente
            </span>
          )}
          <span className="font-[var(--font-mono)] text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
            Módulo {release}
          </span>
        </div>
      </div>
    </>
  );
}

export function ModuleGrid() {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-3)] p-0 min-[480px]:grid-cols-2 lg:grid-cols-4">
      {STUDENT_MODULES.map(({ id, name, description, release, to }) => {
        const content = (
          <ModuleCardContent
            name={name}
            description={description}
            release={release}
            Icon={MODULE_ICON[id]}
            available={Boolean(to)}
          />
        );

        return (
          <li key={id} className="flex">
            {to ? (
              <Link
                to={to}
                className={`${CARD_BASE_CLASS} w-full border-[var(--brand-200)] no-underline shadow-[var(--shadow-sm)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none`}
              >
                {content}
              </Link>
            ) : (
              <div
                className={`${CARD_BASE_CLASS} w-full border-dashed border-[var(--surface-border)]`}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
