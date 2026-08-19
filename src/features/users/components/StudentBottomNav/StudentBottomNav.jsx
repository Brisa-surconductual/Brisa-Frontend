import {
  Home,
  MessageCircle,
  NotebookPen,
  TrendingUp,
  User,
} from 'lucide-react';

/*
 * Navegación principal del estudiante.
 *
 * Solo Inicio está habilitado actualmente.
 * Los demás elementos permanecen visibles para
 * comunicar el alcance futuro del programa.
 */
const NAV_ITEMS = Object.freeze([
  Object.freeze({
    id: 'inicio',
    label: 'Inicio',
    Icon: Home,
  }),

  Object.freeze({
    id: 'chat',
    label: 'Chat',
    Icon: MessageCircle,
  }),

  Object.freeze({
    id: 'diario',
    label: 'Diario',
    Icon: NotebookPen,
  }),

  Object.freeze({
    id: 'progreso',
    label: 'Progreso',
    Icon: TrendingUp,
  }),

  Object.freeze({
    id: 'perfil',
    label: 'Perfil',
    Icon: User,
  }),
]);

export function StudentBottomNav({
  activeItemId = 'inicio',
}) {
  return (
    <nav className="w-full shrink-0 border-t border-[var(--surface-border)] bg-[var(--surface-card)]" aria-label="Secciones del programa">
      <div className="mx-auto flex w-full max-w-[1200px] px-[var(--space-2)] pt-[var(--space-2)] pb-[var(--space-4)] md:px-[var(--space-7)] md:py-[var(--space-3)] lg:gap-[var(--space-2)]">
        {NAV_ITEMS.map(
          ({
            id,
            label,
            Icon,
          }) => {
            const isActive =
              id === activeItemId;

            const stateClass = isActive
              ? 'text-[var(--brand-600)] opacity-100'
              : 'text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-55';

            return (
              <button
                key={id}
                type="button"
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-[var(--space-1)] border-0 bg-transparent p-[var(--space-2)] font-[var(--font-sans)] text-[10px] font-semibold transition-[color,background-color] duration-120 enabled:hover:bg-[var(--surface-hover)] motion-reduce:transition-none md:min-h-[48px] md:flex-row md:gap-[var(--space-2)] md:rounded-[var(--radius-md)] md:px-[var(--space-4)] md:py-[var(--space-2)] md:text-[12px] lg:text-[13px] ${stateClass}`}
                disabled={!isActive}
                aria-current={
                  isActive
                    ? 'page'
                    : undefined
                }
              >
                <Icon
                  size={20}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <span className="leading-[1.2]">
                  {label}
                </span>

                {!isActive && (
                  <span className="absolute h-px w-px overflow-hidden [clip-path:inset(50%)] whitespace-nowrap">
                    Próximamente
                  </span>
                )}
              </button>
            );
          },
        )}
      </div>
    </nav>
  );
}