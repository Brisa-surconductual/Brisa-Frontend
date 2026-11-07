import { useEffect, useId, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

import { useAuth } from '@/app/providers/index.js';

import { getRoleLabel } from '@/features/users/types/authTypes.js';

import { BrisaLogo } from '@/shared/components/brand/BrisaLogo/index.js';
import { useLogoutHandler } from '@/shared/hooks/useLogoutHandler.jsx';

import {
  ADMIN_NAV_ITEMS,
  getActiveAdminSection,
  getAdminSectionLabel,
} from './adminNavigation.js';

const CONTENT_ID = 'contenido-administrativo';

const LINK_CLASS = Object.freeze({
  vertical: Object.freeze({
    base: 'relative flex min-h-[44px] items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] px-[var(--space-3)] text-[length:var(--font-size-md)] no-underline transition-colors duration-150 motion-reduce:transition-none',
    active:
      'bg-[var(--brand-50)] font-bold text-[var(--brand-700)] before:absolute before:top-[10px] before:bottom-[10px] before:left-0 before:w-[3px] before:rounded-[var(--radius-full)] before:bg-[var(--brand-500)]',
    idle: 'font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
  }),
  horizontal: Object.freeze({
    base: 'flex min-h-[44px] items-center gap-[var(--space-2)] border-b-2 px-[var(--space-3)] text-[length:var(--font-size-sm)] no-underline whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none',
    active: 'border-[var(--brand-500)] font-bold text-[var(--brand-700)]',
    idle: 'border-transparent font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  }),
});

/*
 * Lista de navegación: enlaces reales a rutas (no pestañas). La
 * sección activa se marca con aria-current y con un indicador
 * visual que no depende solo del color.
 */
function AdminNavList({ activeSection, variant, onNavigate, firstLinkRef }) {
  const classes = LINK_CLASS[variant];
  const isVertical = variant === 'vertical';

  return (
    <ul
      className={`m-0 list-none p-0 ${
        isVertical
          ? 'flex flex-col gap-[var(--space-1)]'
          : 'flex gap-[var(--space-1)]'
      }`}
    >
      {ADMIN_NAV_ITEMS.map(({ id, label, Icon, to }, index) => {
        const isActive = id === activeSection;

        return (
          <li key={id}>
            <Link
              ref={index === 0 ? firstLinkRef : undefined}
              to={to}
              className={`${classes.base} ${isActive ? classes.active : classes.idle}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={onNavigate}
            >
              <Icon
                size={isVertical ? 20 : 18}
                strokeWidth={1.7}
                className="shrink-0"
                aria-hidden="true"
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/*
 * Layout del área administrativa. Va dentro de ProtectedLayout y
 * de la guarda de rol ADMINISTRATIVO: no protege por sí mismo.
 */
export function AdminLayout() {
  const location = useLocation();
  const { user, role } = useAuth();
  const handleLogout = useLogoutHandler();

  const mobileMenuId = useId();
  const toggleRef = useRef(null);
  const firstLinkRef = useRef(null);

  /*
   * El menú móvil queda abierto solo para la ubicación en la que
   * se abrió: cualquier navegación lo cierra sin efectos extra.
   */
  const [menuOpenAt, setMenuOpenAt] = useState(null);
  const isMenuOpen = menuOpenAt !== null && menuOpenAt === location.key;

  const activeSection = getActiveAdminSection(
    location.pathname,
    location.search,
  );
  const sectionLabel = getAdminSectionLabel(activeSection);

  function closeMenu({ restoreFocus = false } = {}) {
    setMenuOpenAt(null);
    if (restoreFocus) toggleRef.current?.focus();
  }

  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      setMenuOpenAt(location.key);
    }
  }

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    firstLinkRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpenAt(null);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-[var(--surface-bg)] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <a
        href={`#${CONTENT_ID}`}
        className="absolute top-[var(--space-2)] left-[var(--space-2)] z-50 -translate-y-[200%] rounded-[var(--radius-md)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-700)] shadow-[var(--shadow-md)] focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <aside className="sticky top-0 hidden h-screen flex-col gap-[var(--space-6)] border-r border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-6)] lg:flex">
        <div className="px-[var(--space-2)]">
          <BrisaLogo />
        </div>

        <nav aria-label="Navegación administrativa" className="flex flex-col gap-[var(--space-2)]">
          <p className="m-0 px-[var(--space-3)] text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
            Panel administrativo
          </p>

          <AdminNavList activeSection={activeSection} variant="vertical" />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--surface-border)] bg-[var(--surface-card)]">
          <div className="flex min-h-[64px] items-center gap-[var(--space-3)] px-[var(--space-4)] md:px-[var(--space-6)] lg:px-[var(--space-8)]">
            <button
              ref={toggleRef}
              type="button"
              className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none md:hidden"
              aria-expanded={isMenuOpen}
              aria-controls={mobileMenuId}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X size={20} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
              )}
            </button>

            <div className="min-w-0 lg:hidden">
              <BrisaLogo />
            </div>

            <p className="m-0 hidden min-w-0 items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] lg:flex">
              <span className="text-[var(--text-muted)]">Administración</span>
              {sectionLabel && (
                <>
                  <span className="text-[var(--text-muted)]" aria-hidden="true">
                    /
                  </span>
                  <span className="truncate font-bold text-[var(--text-primary)]">
                    {sectionLabel}
                  </span>
                </>
              )}
            </p>

            <div className="ml-auto flex min-w-0 items-center gap-[var(--space-3)]">
              <div className="hidden min-w-0 flex-col items-end sm:flex">
                <span className="max-w-[220px] truncate text-[length:var(--font-size-sm)] font-semibold text-[var(--text-primary)]">
                  {user?.email}
                </span>
                <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
                  {getRoleLabel(role)}
                </span>
              </div>

              <button
                type="button"
                className="inline-flex min-h-[44px] shrink-0 items-center gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-3)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
                onClick={handleLogout}
              >
                <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
                Salir
              </button>
            </div>
          </div>

          <nav
            aria-label="Navegación administrativa"
            className="hidden overflow-x-auto border-t border-[var(--surface-border)] px-[var(--space-4)] md:block md:px-[var(--space-6)] lg:hidden"
          >
            <AdminNavList activeSection={activeSection} variant="horizontal" />
          </nav>

          {isMenuOpen && (
            <nav
              id={mobileMenuId}
              aria-label="Navegación administrativa"
              className="border-t border-[var(--surface-border)] px-[var(--space-4)] py-[var(--space-3)] md:hidden"
            >
              <AdminNavList
                activeSection={activeSection}
                variant="vertical"
                firstLinkRef={firstLinkRef}
                onNavigate={() => closeMenu()}
              />
            </nav>
          )}
        </header>

        <main id={CONTENT_ID} tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
