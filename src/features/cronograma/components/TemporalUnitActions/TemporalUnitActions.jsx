import { Button } from '@/shared/components/ui/Button/index.js';

import { canModifyTemporalUnit } from '@/features/cronograma/utils/temporalUnitPermissions.js';

export function TemporalUnitActions({ status, onEdit, onDelete }) {
  const canModify = canModifyTemporalUnit(status);

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      {!canModify && (
        <p
          className="m-0 rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-3)] text-[12px] leading-[1.5] text-[var(--text-secondary)]"
          role="status"
        >
          Las unidades activas o finalizadas no pueden modificarse ni
          eliminarse.
        </p>
      )}

      <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:justify-end">
        <Button variant="secondary" disabled={!canModify} onClick={onEdit}>
          Editar
        </Button>

        <Button variant="danger" disabled={!canModify} onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}
