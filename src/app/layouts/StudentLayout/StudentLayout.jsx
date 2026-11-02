import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { BrisaLogo } from '@/shared/components/brand/BrisaLogo/index.js';
import { useLogoutHandler } from '@/shared/hooks/useLogoutHandler.jsx';

import {
  STUDENT_NAV_ITEMS,
  getActiveStudentSection,
} from './studentNavigation.js';

const CONTENT_ID = 'contenido-estudiante';

/* Alto de la barra inferior móvil (sin el área segura). */
const BOTTOM_BAR_HEIGHT = 'h-[64px]';

/*
 * Navegación en el encabezado (tableta y escritorio): enlaces en
 * píldora. Con dos destinos reales una barra lateral sobraría.
 */
function StudentTopNav({ activeSection }) {
  return (
    <nav aria-label="Navegación del estudiante" className="hidden md:block">
      <ul className="m-0 flex list-none gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-1)]">
        {STUDENT_NAV_ITEMS.map(({ id, label, Icon, to }) => {
          const isActive = id === activeSection;

          return (
            <li key={id}>
              <Link
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-[40px] items-center gap-[var(--space-2)] rounded-[var(--radius-full)] px-[var(--space-4)] text-[length:var(--font-size-sm)] no-underline transition-colors duration-150 motion-reduce:transition-none ${
                  isActive
                    ? 'bg-[var(--surface-card)] font-bold text-[var(--brand-700)] shadow-[var(--shadow-sm)]'
                    : 'font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/*
 * Barra inferior (móvil): al alcance del pulgar y con el área
 * segura del dispositivo. El contenido reserva su altura.
 */
function StudentBottomBar({ activeSection }) {
  return (
    <nav
      aria-label="Navegación del estudiante"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--surface-border)] bg-[var(--surface-card)] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className={`m-0 grid list-none grid-cols-2 p-0 ${BOTTOM_BAR_HEIGHT}`}>
        {STUDENT_NAV_ITEMS.map(({ id, label, shortLabel, Icon, to }) => {
          const isActive = id === activeSection;

          return (
            <li key={id} className="flex">
              <Link
                to={to}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                className={`relative flex flex-1 flex-col items-center justify-center gap-[2px] text-[length:var(--font-size-xs)] no-underline ${
                  isActive
                    ? 'font-bold text-[var(--brand-700)] before:absolute before:top-0 before:h-[3px] before:w-[32px] before:rounded-b-[var(--radius-full)] before:bg-[var(--brand-500)]'
                    : 'font-semibold text-[var(--text-muted)]'
                }`}
              >
                <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                <span aria-hidden="true">{shortLabel ?? label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/*
 * Layout del portal del estudiante. Va dentro de ProtectedLayout
 * y de la guarda ESTUDIANTE: no protege ni lleva lógica de negocio.
 */
export function StudentLayout() {
  const location = useLocation();
  const handleLogout = useLogoutHandler();
  const activeSection = getActiveStudentSection(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-bg)]">
      <a
        href={`#${CONTENT_ID}`}
        className="absolute top-[var(--space-2)] left-[var(--space-2)] z-50 -translate-y-[200%] rounded-[var(--radius-md)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-700)] shadow-[var(--shadow-md)] focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-[var(--surface-border)] bg-[var(--surface-card)]">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1040px] items-center gap-[var(--space-4)] px-[var(--space-4)] md:min-h-[72px] md:px-[var(--space-6)]">
          <BrisaLogo />

          <div className="ml-auto flex items-center gap-[var(--space-3)]">
            <StudentTopNav activeSection={activeSection} />

            <button
              type="button"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
              onClick={handleLogout}
            >
              <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main
        id={CONTENT_ID}
        tabIndex={-1}
        className="mx-auto w-full max-w-[1040px] flex-1 px-[var(--space-4)] pt-[var(--space-6)] pb-[calc(64px+env(safe-area-inset-bottom)+var(--space-6))] focus:outline-none md:px-[var(--space-6)] md:pt-[var(--space-8)] md:pb-[var(--space-10)]"
      >
        <Outlet />
      </main>

      <StudentBottomBar activeSection={activeSection} />
    </div>
  );
}
