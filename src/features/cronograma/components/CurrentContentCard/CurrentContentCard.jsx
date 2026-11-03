import {
  BookOpen,
  CalendarRange,
  ChevronRight,
  CircleDot,
  Layers,
  ListOrdered,
} from 'lucide-react';

import { PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL } from '@/features/cronograma/types/contentTypes.js';

/*
 * Contenido vigente. Lo usan el portal del estudiante y la
 * información temporal del administrativo, con las mismas props.
 * `headingLevel` permite al consumidor encajar el título en su
 * jerarquía (por defecto h2, como siempre). La selección solo
 * existe si se recibe `onSelect`.
 */
export function CurrentContentCard({
  content,
  onSelect,
  headingLevel = 2,
}) {
  const typeLabel =
    PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL[content.type] ??
    content.type;
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const titleClass =
    'm-0 text-[length:var(--font-size-lg)] leading-[var(--line-height-snug)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]';

  return (
    <article className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)]">
      <div className="flex items-start gap-[var(--space-3)]">
        <span
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
          aria-hidden="true"
        >
          <BookOpen size={20} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <Heading className={titleClass}>
            {onSelect ? (
              <button
                type="button"
                className="inline-flex min-h-[44px] w-full items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-sm)] bg-transparent p-0 text-left font-[inherit] text-[length:inherit] text-[var(--text-primary)] underline-offset-2 hover:underline"
                onClick={() => onSelect(content)}
              >
                <span className="min-w-0">{content.name}</span>
                <ChevronRight
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 text-[var(--brand-600)]"
                  aria-hidden="true"
                />
              </button>
            ) : (
              content.name
            )}
          </Heading>

          <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
            {typeLabel}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--brand-700)]">
          <CircleDot size={12} strokeWidth={2} aria-hidden="true" />
          Vigente
        </span>
      </div>

      <dl className="m-0 grid gap-[var(--space-2)] rounded-[var(--radius-lg)] bg-[var(--surface-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)]">
        <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[2px]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
            <Layers size={15} strokeWidth={1.8} aria-hidden="true" />
            Unidad
          </dt>
          <dd className="m-0 font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
            {content.temporalUnitName}
            {Number.isFinite(content.temporalUnitOrder)
              ? ` · Semana ${content.temporalUnitOrder}`
              : ''}
          </dd>
        </div>

        {Number.isFinite(content.order) ? (
          <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[2px]">
            <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
              <ListOrdered size={15} strokeWidth={1.8} aria-hidden="true" />
              Orden
            </dt>
            <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
              {content.order}
            </dd>
          </div>
        ) : null}

        {content.availabilityText ? (
          <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[2px]">
            <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
              <CalendarRange size={15} strokeWidth={1.8} aria-hidden="true" />
              Disponibilidad
            </dt>
            <dd className="m-0 font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
              {content.availabilityText}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
