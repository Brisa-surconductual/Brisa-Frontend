import {
  ArrowDown,
  ArrowUp,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import {
  PSYCHOEDUCATIONAL_RESOURCE_TYPE,
  PSYCHOEDUCATIONAL_RESOURCE_TYPE_LABEL,
} from '@/features/cronograma/types/resourceTypes.js';

const TYPE_ICON = Object.freeze({
  [PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO]: FileText,
  [PSYCHOEDUCATIONAL_RESOURCE_TYPE.IMAGEN]: FileImage,
  [PSYCHOEDUCATIONAL_RESOURCE_TYPE.VIDEO]: FileVideo,
  [PSYCHOEDUCATIONAL_RESOURCE_TYPE.AUDIO]: FileAudio,
  [PSYCHOEDUCATIONAL_RESOURCE_TYPE.DOCUMENTO]: File,
});

// Botón compacto solo con ícono: el nombre accesible lo da aria-label.
const ICON_BUTTON_CLASS =
  'inline-flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] border-[1.5px] border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--text-primary)] transition-colors duration-150 enabled:hover:bg-[var(--button-secondary-hover-bg)] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none';

export function PsychoeducationalResourceCard({
  resource,
  destinationModules = [],
  canManage = false,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
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

  const associatedModules = destinationModules.filter(
    (module) =>
      Array.isArray(resource.moduleIds) &&
      resource.moduleIds.includes(module.id),
  );

  const TypeIcon = TYPE_ICON[resource.type] ?? File;
  const blockName = `bloque ${resource.order}`;

  return (
    <article className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)]">
      <div className="flex items-start gap-[var(--space-3)]">
        <span
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
          aria-hidden="true"
        >
          <TypeIcon size={20} strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase tabular-nums">
            Bloque {resource.order}
          </p>

          <h3 className="mt-[2px] mb-0 text-[length:var(--font-size-base)] font-extrabold text-[var(--text-primary)]">
            {typeLabel}
          </h3>
        </div>
      </div>

      {isText ? (
        <p className="m-0 line-clamp-4 whitespace-pre-wrap text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] [overflow-wrap:anywhere] text-[var(--text-secondary)]">
          {resource.textContent}
        </p>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-4)] py-[var(--space-3)]">
          <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
            Archivo multimedia asociado
          </p>

          <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-xs)] [overflow-wrap:anywhere] text-[var(--text-muted)]">
            {resource.fileName ??
              'El archivo se resolverá mediante la fuente de datos integrada.'}
          </p>
        </div>
      )}

      <div>
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold text-[var(--text-muted)]">
          Módulos destino
        </p>

        {associatedModules.length > 0 ? (
          <ul className="m-0 mt-[var(--space-2)] flex list-none flex-wrap gap-[var(--space-2)] p-0">
            {associatedModules.map((module) => (
              <li
                key={module.id}
                className="rounded-[var(--radius-full)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-[var(--space-3)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--brand-700)]"
              >
                {module.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-[var(--space-2)] mb-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--warning-text)]">
            Sin módulos asociados.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)]">
        <div
          className="flex gap-[var(--space-2)]"
          role="group"
          aria-label={`Orden del ${blockName}`}
        >
          <button
            type="button"
            className={ICON_BUTTON_CLASS}
            disabled={!canMoveUp}
            aria-label={`Subir ${blockName}`}
            onClick={() => onMoveUp?.(resource)}
          >
            <ArrowUp size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={ICON_BUTTON_CLASS}
            disabled={!canMoveDown}
            aria-label={`Bajar ${blockName}`}
            onClick={() => onMoveDown?.(resource)}
          >
            <ArrowDown size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap gap-[var(--space-2)]">
          <Button
            variant="secondary"
            disabled={!canManage}
            onClick={() => onEdit?.(resource)}
          >
            <Pencil size={17} strokeWidth={1.8} aria-hidden="true" />
            Editar
            <span className="sr-only"> {blockName}</span>
          </Button>

          <Button
            variant="secondary"
            disabled={!canManage}
            onClick={() => onDelete?.(resource)}
          >
            <span className="inline-flex items-center gap-[var(--space-2)] text-[var(--danger-text)]">
              <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
              Eliminar
              <span className="sr-only"> {blockName}</span>
            </span>
          </Button>
        </div>
      </div>
    </article>
  );
}
