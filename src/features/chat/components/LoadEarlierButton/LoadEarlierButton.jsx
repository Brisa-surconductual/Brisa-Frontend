import { History, LoaderCircle } from 'lucide-react';

import { ApiErrorMessage } from '@/shared/components/ui/ApiErrorMessage/index.js';

import { GLASS } from '../../utils/glass.js';

// RF-32 (CA-32-2): pide la página anterior del historial. Píldora de vidrio
// centrada sobre el hilo. Si falla, se muestra el mensaje del backend tal
// cual con su reintento (ADR-0004) y el hilo ya cargado no se toca.
export function LoadEarlierButton({ cargando, error, onCargar }) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-2)]">
      <button
        type="button"
        onClick={onCargar}
        disabled={cargando}
        aria-busy={cargando}
        className={`inline-flex min-h-[44px] items-center gap-[var(--space-2)] rounded-[var(--radius-full)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-semibold text-[var(--brand-700)] transition-shadow duration-200 enabled:hover:shadow-[var(--glass-glow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)] disabled:cursor-progress motion-reduce:transition-none ${GLASS.panelTexto}`}
      >
        {cargando ? (
          <LoaderCircle
            size={18}
            strokeWidth={1.75}
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
          />
        ) : (
          <History size={18} strokeWidth={1.75} aria-hidden="true" />
        )}
        {cargando ? 'Cargando mensajes anteriores' : 'Ver mensajes anteriores'}
      </button>

      <div aria-live="polite" className="w-full">
        {error && !cargando && (
          <ApiErrorMessage error={error} onRetry={onCargar} />
        )}
      </div>
    </div>
  );
}
