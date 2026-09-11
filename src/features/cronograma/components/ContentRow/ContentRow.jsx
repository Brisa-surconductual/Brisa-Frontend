import {
  CONTENT_TYPE_LABEL,
  CONTENT_TYPE_TONE,
  SCHEDULED_CONTENT_STATUS_LABEL,
  SCHEDULED_CONTENT_STATUS_TONE,
} from '@/features/cronograma/types/contentTypes.js';
import { StatusBadge } from '@/features/cronograma/components/StatusBadge/index.js';

const DOT_CLASS = Object.freeze({
  brand: 'bg-[var(--brand-500)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger: 'bg-[var(--danger)]',
  info: 'bg-[var(--info)]',
  neutral: 'bg-[var(--neutral-400)]',
});

/**
 * Fila de contenido programado dentro de una unidad temporal.
 *
 * `actions` es un nodo, no una lista de callbacks: quien la usa decide qué
 * botones pinta según canModifyScheduledContent(), sin que esta fila conozca
 * la regla.
 *
 * Si hay onSelect solo el título es interactivo, para no anidar los botones de
 * `actions` dentro de otro botón.
 *
 * El tipo de contenido se muestra siempre como texto: el punto de color es
 * decorativo, porque el color nunca puede ser el único indicador.
 */
export function ContentRow({
  order,
  title,
  contentType,
  status,
  subtitle,
  actions,
  onSelect,
}) {
  const typeLabel = CONTENT_TYPE_LABEL[contentType] ?? 'Por definir';
  const typeTone = CONTENT_TYPE_TONE[contentType] ?? 'neutral';

  return (
    <div className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-3)] py-[var(--space-2)]">
      <span className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--text-muted)]">
        #{order ?? '–'}
      </span>

      <span
        aria-hidden="true"
        className={`h-[8px] w-[8px] shrink-0 rounded-[var(--radius-full)] ${
          DOT_CLASS[typeTone] ?? DOT_CLASS.neutral
        }`}
      />

      <div className="min-w-0 flex-1">
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="block w-full truncate bg-transparent p-0 text-left text-[13px] font-bold text-[var(--text-primary)] underline-offset-2 hover:underline"
          >
            {title}
          </button>
        ) : (
          <div className="truncate text-[13px] font-bold text-[var(--text-primary)]">
            {title}
          </div>
        )}

        <div className="mt-[var(--space-1)] truncate text-[11px] text-[var(--text-muted)]">
          {typeLabel}
          {subtitle ? <> · {subtitle}</> : null}
        </div>
      </div>

      <StatusBadge
        tone={SCHEDULED_CONTENT_STATUS_TONE[status]}
        label={SCHEDULED_CONTENT_STATUS_LABEL[status] ?? status}
      />

      {actions ? (
        <div className="flex shrink-0 gap-[var(--space-1)]">{actions}</div>
      ) : null}
    </div>
  );
}
