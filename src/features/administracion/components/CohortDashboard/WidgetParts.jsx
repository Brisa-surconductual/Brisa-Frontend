import { ChevronDown } from 'lucide-react';

// Subtítulo de un grupo dentro de un widget.
export function WidgetGroupTitle({ children }) {
  return (
    <h3 className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
      {children}
    </h3>
  );
}

/*
 * Información secundaria desplegable (elemento nativo <details>: se abre
 * con teclado y lectores de pantalla sin código adicional). Solo explica
 * cómo leer las cifras; no oculta datos ni revela nada individual.
 */
export function WidgetExplainer({ summary, children }) {
  return (
    <details className="group rounded-[var(--radius-md)] border border-[var(--surface-border)]">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-3)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className="shrink-0 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className="px-[var(--space-3)] pb-[var(--space-3)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
        {children}
      </div>
    </details>
  );
}
