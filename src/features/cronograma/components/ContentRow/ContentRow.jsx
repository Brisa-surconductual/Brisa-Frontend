import {
  CONTENT_TYPE_LABEL,
  CONTENT_TYPE_TONE,
  PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL,
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
 *
 * Con poco ancho (según su contenedor, no la ventana) el estado y las
 * acciones bajan a su propia línea: el título se ajusta sin truncarse.
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
  const typeLabel =
    PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL[contentType] ??
    CONTENT_TYPE_LABEL[contentType] ??
    'Por definir';
  const typeTone = CONTENT_TYPE_TONE[contentType] ?? 'neutral';
  const titleClass =
    'text-[length:var(--font-size-md)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]';

  return (
    <div className="@container rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)]">
      <div className="flex flex-col gap-[var(--space-3)] @xl:flex-row @xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-[var(--space-3)]">
          <span className="mt-[1px] inline-flex min-w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-[var(--space-2)] py-[2px] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)] tabular-nums">
            D{order ?? '–'}
          </span>

          <div className="min-w-0 flex-1">
            {onSelect ? (
              <button
                type="button"
                onClick={onSelect}
                className={`block w-full bg-transparent p-0 text-left underline-offset-2 hover:underline ${titleClass}`}
              >
                {title}
              </button>
            ) : (
              <div className={titleClass}>{title}</div>
            )}

            <div className="mt-[var(--space-1)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-1)] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-[var(--space-2)] font-semibold">
                <span
                  aria-hidden="true"
                  className={`h-[8px] w-[8px] shrink-0 rounded-[var(--radius-full)] ${
                    DOT_CLASS[typeTone] ?? DOT_CLASS.neutral
                  }`}
                />
                {typeLabel}
              </span>

              {subtitle ? (
                <span className="tabular-nums">{subtitle}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-[var(--space-2)] pl-[48px] @xl:shrink-0 @xl:pl-0">
          <StatusBadge
            tone={SCHEDULED_CONTENT_STATUS_TONE[status]}
            label={SCHEDULED_CONTENT_STATUS_LABEL[status] ?? status}
          />

          {actions ? (
            <div className="flex flex-wrap gap-[var(--space-2)]">{actions}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
