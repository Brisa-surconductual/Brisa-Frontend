import { Archive, CheckCircle2, PencilLine } from 'lucide-react';

import {
  ESTADO_FLUJO,
  ESTADO_FLUJO_ETIQUETA,
} from '../../types/estadoFlujo.js';

// Ícono y texto acompañan siempre al color: el estado nunca va solo en color.
const STATUS_VIEW = Object.freeze({
  [ESTADO_FLUJO.BORRADOR]: {
    Icon: PencilLine,
    className:
      'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  },
  [ESTADO_FLUJO.PUBLICADO]: {
    Icon: CheckCircle2,
    className:
      'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  },
  [ESTADO_FLUJO.ARCHIVADO]: {
    Icon: Archive,
    className:
      'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  },
});

export function FlowStatusBadge({ estado }) {
  const view = STATUS_VIEW[estado] ?? STATUS_VIEW[ESTADO_FLUJO.BORRADOR];
  const { Icon } = view;

  return (
    <span
      className={`inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold whitespace-nowrap ${view.className}`}
    >
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
      {ESTADO_FLUJO_ETIQUETA[estado] ?? estado}
    </span>
  );
}
