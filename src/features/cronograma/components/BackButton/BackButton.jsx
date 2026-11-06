import { ArrowLeft } from 'lucide-react';

/*
 * Regreso de las pantallas de cronogramas. Conserva el destino
 * que decide cada página (onClick); solo unifica la presentación
 * y el área táctil de 44 px.
 */
export function BackButton({ onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] transition-colors duration-150 hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
    >
      <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
      {children}
    </button>
  );
}
