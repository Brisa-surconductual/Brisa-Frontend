import { Timer } from 'lucide-react';

import {
  describirRestante,
  formatearRestante,
} from '../../../../services/sos/tiempoSos.js';

/*
 * RF-43: tiempo restante con el límite del servidor. No se anuncia cada
 * segundo (sería ruido para el lector de pantalla); el nombre accesible
 * lleva el valor y la pantalla avisa al agotarse.
 */
export function SosTimer({ restanteMs }) {
  const agotado = restanteMs !== null && restanteMs <= 0;

  return (
    <p
      role="timer"
      aria-label={`Tiempo restante: ${describirRestante(restanteMs)}`}
      className={`m-0 inline-flex min-h-[36px] shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-3)] font-[family-name:var(--font-mono)] text-[length:var(--font-size-sm)] font-bold tabular-nums ${
        agotado
          ? 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]'
          : 'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-primary)]'
      }`}
    >
      <Timer size={18} strokeWidth={1.8} aria-hidden="true" />
      {formatearRestante(restanteMs)}
    </p>
  );
}
