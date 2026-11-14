import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

/*
 * Paginación del seguimiento (offset y limit, RF-142). Solo presenta:
 * la página la pide el hook a la fuente. El rango se anuncia a lectores
 * de pantalla al cambiar.
 */
export function TrackingPagination({ range, total, pageNumber, pageCount, canGoBack, canGoForward, disabled = false, onBack, onForward }) {
  return (
    <nav
      aria-label="Paginación del seguimiento"
      className="flex flex-col items-stretch gap-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="m-0 text-center text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] sm:text-left">
        {range.from}–{range.to} de {total} {total === 1 ? 'participante' : 'participantes'} · página {pageNumber} de {pageCount}
      </p>

      <div className="grid grid-cols-2 gap-[var(--space-2)] sm:flex">
        <Button variant="secondary" onClick={onBack} disabled={disabled || !canGoBack} className="min-h-[44px]">
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          Anterior
        </Button>
        <Button variant="secondary" onClick={onForward} disabled={disabled || !canGoForward} className="min-h-[44px]">
          Siguiente
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
