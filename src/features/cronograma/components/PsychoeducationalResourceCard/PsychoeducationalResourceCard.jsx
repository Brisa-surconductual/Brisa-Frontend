import { Button } from '@/shared/components/ui/Button/index.js';

import {
  PSYCHOEDUCATIONAL_RESOURCE_TYPE,
  PSYCHOEDUCATIONAL_RESOURCE_TYPE_LABEL,
} from '@/features/cronograma/types/resourceTypes.js';

export function PsychoeducationalResourceCard({
  resource,
  canManage = false,
  onEdit,
  onDelete,
}) {
  const typeLabel =
    PSYCHOEDUCATIONAL_RESOURCE_TYPE_LABEL[
      resource.type
    ] ?? resource.type;

  const isText =
    resource.type ===
    PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO;

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="m-0 text-[11px] font-bold tracking-[0.04em] text-[var(--text-muted)] uppercase">
            Bloque {resource.order}
          </p>

          <h3 className="mt-[var(--space-1)] mb-0 text-[16px] font-extrabold text-[var(--text-primary)]">
            {typeLabel}
          </h3>
        </div>

        <span className="rounded-[var(--radius-full)] bg-[var(--brand-100)] px-[var(--space-3)] py-[var(--space-1)] text-[10px] font-extrabold tracking-[0.03em] text-[var(--brand-700)] uppercase">
          {typeLabel}
        </span>
      </div>

      <div className="mt-[var(--space-4)]">
        {isText ? (
          <p className="m-0 line-clamp-4 whitespace-pre-wrap text-[13px] leading-[1.6] text-[var(--text-secondary)]">
            {resource.textContent}
          </p>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-hover)] p-[var(--space-4)]">
            <p className="m-0 text-[12px] font-semibold text-[var(--text-secondary)]">
              Archivo multimedia asociado
            </p>

            <p className="mt-[var(--space-1)] mb-0 text-[11px] text-[var(--text-muted)]">
              {resource.fileName ??
                'El archivo se resolverá mediante la fuente de datos integrada.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-[var(--space-5)] flex flex-wrap justify-end gap-[var(--space-3)]">
        <Button
          variant="secondary"
          size="small"
          disabled={!canManage}
          onClick={() => onEdit?.(resource)}
        >
          Editar
        </Button>

        <Button
          variant="danger"
          size="small"
          disabled={!canManage}
          onClick={() => onDelete?.(resource)}
        >
          Eliminar
        </Button>
      </div>
    </article>
  );
}