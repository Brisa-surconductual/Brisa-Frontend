import { ClockAlert } from 'lucide-react';

import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';

/*
 * Advertencia de modo degradado de UNA sección (RF-149). Prominente,
 * siempre visible y sin botón de cierre: no puede ocultarse. Incluye la
 * fecha y hora exactas del último dato que entregó el backend, en hora
 * de Colombia; solo se usa cuando esa fecha es confiable. Ícono y texto
 * acompañan al color.
 */
export function StaleDataNotice({ moduleLabel, lastAvailableAt }) {
  const label = formatAuditTimestamp(lastAvailableAt);

  return (
    <div
      role="status"
      className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-2 border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--warning-text)]"
    >
      <ClockAlert size={22} strokeWidth={2} className="mt-[1px] shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <strong className="block text-[length:var(--font-size-md)]">Modo degradado: datos desactualizados</strong>
        <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)]">
          Los datos de {moduleLabel} no están actualizados en tiempo real. Se
          muestra el último registro disponible, del{' '}
          <time dateTime={lastAvailableAt} className="font-bold">{label}</time> (hora de Colombia).
        </p>
      </div>
    </div>
  );
}

// Marca junto al título de la sección: el estado no depende solo del aviso.
export function StaleBadge() {
  return (
    <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--warning-text)]">
      <ClockAlert size={12} strokeWidth={2} aria-hidden="true" />
      Desactualizado
    </span>
  );
}
