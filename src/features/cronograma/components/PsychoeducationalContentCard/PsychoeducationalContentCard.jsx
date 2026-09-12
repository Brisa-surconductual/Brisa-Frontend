import { Button } from '@/shared/components/ui/Button/index.js';

import { PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL } from '@/features/cronograma/types/contentTypes.js';

export function PsychoeducationalContentCard({
  content,
  onEdit,
  onDelete,
}) {
  const typeLabel =
    PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL[content.type] ??
    content.type;

  const canEdit = content.canEdit === true;
  const canDelete = content.canDelete === true;

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)] md:text-[18px]">
            {content.name}
          </h2>

          <p className="mt-[var(--space-2)] mb-0 text-[12px] text-[var(--text-muted)]">
            Contenido psicoeducativo
          </p>
        </div>

        <span className="rounded-[var(--radius-full)] bg-[var(--brand-100)] px-[var(--space-3)] py-[var(--space-1)] text-[10px] font-extrabold tracking-[0.03em] text-[var(--brand-700)] uppercase">
          {typeLabel}
        </span>
      </div>

      {(!canEdit || !canDelete) && (
        <p className="mt-[var(--space-4)] mb-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
          Algunas acciones no están disponibles para este contenido.
        </p>
      )}

      <div className="mt-[var(--space-5)] flex flex-wrap justify-end gap-[var(--space-3)]">
        <Button
          variant="secondary"
          size="small"
          disabled={!canEdit}
          onClick={() => onEdit?.(content)}
        >
          Editar
        </Button>

        <Button
          variant="danger"
          size="small"
          disabled={!canDelete}
          onClick={() => onDelete?.(content)}
        >
          Eliminar
        </Button>
      </div>
    </article>
  );
}