import { StatusBadge } from '@/features/cronograma/components/StatusBadge/index.js';
import { PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL } from '@/features/cronograma/types/contentTypes.js';

export function CurrentContentCard({
  content,
  onSelect,
}) {
  const typeLabel =
    PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL[content.type] ??
    content.type;

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div className="min-w-0 flex-1">
          {onSelect ? (
            <button
              type="button"
              className="block w-full bg-transparent p-0 text-left"
              onClick={() => onSelect(content)}
            >
              <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)] underline-offset-2 hover:underline md:text-[18px]">
                {content.name}
              </h2>
            </button>
          ) : (
            <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)] md:text-[18px]">
              {content.name}
            </h2>
          )}

          <p className="mt-[var(--space-2)] mb-0 text-[12px] text-[var(--text-secondary)]">
            {content.temporalUnitName}
            {Number.isFinite(content.temporalUnitOrder)
              ? ` · Semana ${content.temporalUnitOrder}`
              : ''}
          </p>
        </div>

        <StatusBadge
          tone="brand"
          label="Vigente"
        />
      </div>

      <div className="mt-[var(--space-4)] grid gap-[var(--space-2)] text-[12px] text-[var(--text-muted)]">
        <p className="m-0">
          <span className="font-semibold text-[var(--text-secondary)]">
            Tipo:
          </span>{' '}
          {typeLabel}
        </p>

        {Number.isFinite(content.order) ? (
          <p className="m-0">
            <span className="font-semibold text-[var(--text-secondary)]">
              Orden:
            </span>{' '}
            {content.order}
          </p>
        ) : null}

        {content.availabilityText ? (
          <p className="m-0">
            <span className="font-semibold text-[var(--text-secondary)]">
              Disponibilidad:
            </span>{' '}
            {content.availabilityText}
          </p>
        ) : null}
      </div>
    </article>
  );
}