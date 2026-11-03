import { NavLink } from 'react-router-dom';
import { GitBranch, SlidersHorizontal } from 'lucide-react';

const SECTIONS = Object.freeze([
  Object.freeze({
    label: 'Modalidad',
    path: '/app/administrativo/chat/modalidad',
    icon: SlidersHorizontal,
  }),
  Object.freeze({
    label: 'Árboles',
    path: '/app/administrativo/chat/arboles',
    icon: GitBranch,
  }),
]);

/*
 * Subnavegación del área de Chat. NavLink marca la sección
 * activa con aria-current="page"; el subrayado y el peso de la
 * fuente la distinguen sin depender solo del color.
 */
export function ChatSectionTabs() {
  return (
    <nav
      aria-label="Secciones del módulo Chat"
      className="border-b border-[var(--surface-border)] bg-[var(--surface-card)]"
    >
      <div className="mx-auto flex w-full max-w-[1200px] gap-[var(--space-1)] overflow-x-auto px-[var(--space-4)] md:px-[var(--space-7)]">
        {SECTIONS.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end
            className={({ isActive }) =>
              `inline-flex min-h-[48px] items-center gap-[var(--space-2)] border-b-2 px-[var(--space-4)] text-[length:var(--font-size-sm)] whitespace-nowrap no-underline transition-colors duration-150 motion-reduce:transition-none ${
                isActive
                  ? 'border-[var(--brand-500)] font-bold text-[var(--brand-700)]'
                  : 'border-transparent font-semibold text-[var(--text-secondary)] hover:border-[var(--surface-border)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
