import { Button } from '@/shared/components/ui/Button/index.js';
import { PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL } from '@/features/cronograma/types/contentTypes.js';
import { Layers, Calendar, CheckCircle2, AlertCircle, Lock } from 'lucide-react'; // Añadí Lock para el ícono de bloqueo

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

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)] flex flex-col justify-between">
      <div>
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

        <div className="mt-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-hover)] p-[var(--space-3)] text-[12px]">
          {content.associated ? (
            <div className="flex flex-col gap-[var(--space-2)]">
              <div className="flex items-center gap-[var(--space-2)] text-[var(--text-primary)]">
                <Layers size={14} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
                <span>
                  Unidad temporal: <strong className="font-semibold">{content.temporalUnitName}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--surface-border)] pt-[var(--space-2)]">
                <div className="flex items-center gap-[var(--space-2)] text-[var(--text-secondary)]">
                  <Calendar size={14} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                  <span>Cronograma: <strong className="font-semibold">{content.cronogramaName}</strong></span>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isCronogramaActive 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {isCronogramaActive ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                  {content.cronogramaStatus}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-[var(--space-2)] text-[var(--text-muted)] italic">
              <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
              <span>Este contenido no está asociado a ninguna unidad temporal actualmente.</span>
            </div>
          )}
        </div>
      </div>

      {/* RENDERIZADO CONDICIONAL DE MENSAJES DE BLOQUEO */}
      {isCronogramaActive ? (
        <div className="mt-[var(--space-4)] flex items-start gap-[var(--space-2)] rounded-[var(--radius-sm)] bg-amber-50 p-[var(--space-3)] text-amber-900 border border-amber-200">
          <Lock size={14} className="mt-[2px] shrink-0 text-amber-600" aria-hidden="true" />
          <p className="m-0 text-[12px] leading-[1.5] font-medium">
            Un cronograma activo no se puede ALTERAR.
          </p>
        </div>
      ) : (!canEdit || !canDelete) ? (
        <p className="mt-[var(--space-4)] mb-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
          Este contenido pertenece a un cronograma activo. Sus datos y recursos
          son de solo lectura.
        </p>
      ) : null}

      <p className="mt-[var(--space-3)] text-[13px] text-[var(--text-secondary)]">
        {content.resourcesReady
          ? 'Recursos configurados'
          : 'Pendiente de completar recursos y módulos destino'}
      </p>

      <div className="mt-[var(--space-5)] flex flex-wrap justify-end gap-[var(--space-3)]">
        <Button
          variant="secondary"
          size="small"
          disabled={disableEditActions}
          onClick={() => onManageResources?.(content)}
        >
          {canEdit ? 'Gestionar recursos' : 'Ver recursos'}
        </Button>

        <Button
          variant="secondary"
          size="small"
          disabled={disableEditActions}
          onClick={() => onEdit?.(content)}
        >
          Editar
        </Button>

        <Button
          variant="danger"
          size="small"
          disabled={disableDeleteAction}
          onClick={() => onDelete?.(content)}
        >
          Eliminar
        </Button>
      </div>
    </article>
  );
}
