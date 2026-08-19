import {
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

export function ModuleGrid() {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 min-[480px]:grid-cols-2 lg:grid-cols-4">
      {STUDENT_MODULES.map(({ id, name, description, release }) => {
        const Icon = MODULE_ICON[id];

        return (
          <li
            key={id}
            className="flex min-h-[170px] min-w-0 flex-col gap-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] opacity-75 md:min-h-[190px] md:p-[var(--space-5)] lg:min-h-[210px]"
          >
            <Icon
              className="shrink-0 text-[var(--text-secondary)]"
              size={22}
              strokeWidth={1.6}
              aria-hidden="true"
            />

            <h3 className="m-0 text-[13px] font-bold text-[var(--text-primary)] md:text-[14px]">
              {name}
            </h3>

            <p className="m-0 text-[11px] leading-[1.4] text-[var(--text-muted)] md:text-[12px]">
              {description}
            </p>

            <p className="mt-auto mb-0 font-[var(--font-mono)] text-[10px] font-semibold text-[var(--brand-600)] md:text-[11px]">
              {release} · próximamente
            </p>
          </li>
        );
      })}
    </ul>
  );
}