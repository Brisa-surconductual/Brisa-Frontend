import { NavLink } from 'react-router-dom';

const SECTIONS = [
  {
    label: 'Modalidad',
    path: '/app/administrativo/chat/modalidad',
  },
  {
    label: 'Árboles',
    path: '/app/administrativo/chat/arboles',
  },
];

export function ChatSectionTabs() {
  return (
    <nav
      aria-label="Secciones del módulo Chat"
      className="border-b border-[var(--surface-border)] bg-[var(--surface-card)]"
    >
      <div className="mx-auto flex w-full max-w-[1200px] px-[var(--space-4)] md:px-[var(--space-7)]">
        {SECTIONS.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            end
            className={({ isActive }) =>
              `border-b-2 px-[var(--space-5)] py-[var(--space-3)] text-sm font-bold no-underline transition-colors ${
                isActive
                  ? 'border-[var(--brand-500)] text-[var(--brand-600)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
