import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  FileStack,
  Layers,
  Lock,
  Pencil,
  Trash2,
  Unlink,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL } from '@/features/cronograma/types/contentTypes.js';

import { ScheduleStatusBadge } from '../ScheduleStatusBadge/index.js';
import { StatusChip } from '../StatusChip/index.js';

/*
 * Tarjeta del catálogo. Las reglas de habilitación (canEdit,
 * canDelete y cronograma activo) son las mismas de siempre: solo
 * cambia la presentación.
 */
export function PsychoeducationalContentCard({
  content,
  onManageResources,
  onEdit,
  onDelete,
}) {
  const typeLabel =
    PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL[content.type] ?? content.type;

  const canEdit = content.canEdit === true;
  const canDelete = content.canDelete === true;

  const isCronogramaActive = content.cronogramaStatus === 'ACTIVO';

  const disableEditActions = !canEdit || isCronogramaActive;
  const disableDeleteAction = !canDelete || isCronogramaActive;
  const hasResourceCount = Number.isFinite(content.resourceCount);

  return (
    <article className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)]">
      <div className="flex flex-col gap-[var(--space-2)]">
        <h3 className="m-0 text-[length:var(--font-size-lg)] leading-[var(--line-height-snug)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          {content.name}
        </h3>

        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <StatusChip tone="brand">{typeLabel}</StatusChip>

          {content.resourcesReady ? (
            <StatusChip tone="success" icon={CircleCheck}>
              Listo para programar
            </StatusChip>
          ) : (
            <StatusChip tone="warning" icon={CircleAlert}>
              Pendiente de recursos
            </StatusChip>
          )}

          {hasResourceCount && (
            <span className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]">
              <FileStack size={14} strokeWidth={1.8} aria-hidden="true" />
              {content.resourceCount}{' '}
              {content.resourceCount === 1 ? 'recurso' : 'recursos'}
            </span>
          )}
        </div>

        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          {content.resourcesReady
            ? 'Recursos configurados'
            : 'Pendiente de completar recursos y módulos destino'}
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)]">
        {content.associated ? (
          <dl className="m-0 flex flex-col gap-[var(--space-2)]">
            <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)]">
              <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                <Layers size={15} strokeWidth={1.8} aria-hidden="true" />
                Unidad temporal
              </dt>
              <dd className="m-0 font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
                {content.temporalUnitName}
              </dd>
            </div>

            <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)]">
              <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                <CalendarDays size={15} strokeWidth={1.8} aria-hidden="true" />
                Cronograma
              </dt>
              <dd className="m-0 flex flex-wrap items-center gap-[var(--space-2)] font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
                {content.cronogramaName}
                <ScheduleStatusBadge status={content.cronogramaStatus} />
              </dd>
            </div>
          </dl>
        ) : (
          <p className="m-0 inline-flex items-start gap-[var(--space-2)] text-[var(--text-secondary)]">
            <Unlink
              size={15}
              strokeWidth={1.8}
              className="mt-[2px] shrink-0"
              aria-hidden="true"
            />
            Este contenido no está asociado a ninguna unidad temporal
            actualmente.
          </p>
        )}
      </div>

      {isCronogramaActive ? (
        <p className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--warning-text)]">
          <Lock
            size={15}
            strokeWidth={1.8}
            className="mt-[2px] shrink-0"
            aria-hidden="true"
          />
          Un cronograma activo no se puede alterar.
        </p>
      ) : !canEdit || !canDelete ? (
        <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Este contenido pertenece a un cronograma activo. Sus datos y
          recursos son de solo lectura.
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-[var(--space-2)] border-t border-[var(--surface-border)] pt-[var(--space-4)]">
        <Button
          variant="secondary"
          disabled={disableEditActions}
          onClick={() => onManageResources?.(content)}
        >
          <FileStack size={17} strokeWidth={1.8} aria-hidden="true" />
          {canEdit ? 'Gestionar recursos' : 'Ver recursos'}
          <span className="sr-only"> de {content.name}</span>
        </Button>

        <Button
          variant="secondary"
          disabled={disableEditActions}
          onClick={() => onEdit?.(content)}
        >
          <Pencil size={17} strokeWidth={1.8} aria-hidden="true" />
          Editar
          <span className="sr-only"> {content.name}</span>
        </Button>

        <Button
          variant="secondary"
          disabled={disableDeleteAction}
          onClick={() => onDelete?.(content)}
        >
          <span className="inline-flex items-center gap-[var(--space-2)] text-[var(--danger-text)]">
            <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
            Eliminar
            <span className="sr-only"> {content.name}</span>
          </span>
        </Button>
      </div>
    </article>
  );
}
