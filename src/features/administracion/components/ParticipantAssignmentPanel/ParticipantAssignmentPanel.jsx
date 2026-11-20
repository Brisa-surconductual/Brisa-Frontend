import { useId } from 'react';
import { AlertTriangle, CircleSlash, FlaskConical, RefreshCw, UserPlus, X } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';

import { CohortNotice } from '../CohortNotice/index.js';

/*
 * Panel de asignación de participantes a una cohorte (RF-125). Solo
 * presenta: la selección, los conflictos y el envío los gestiona
 * useParticipantAssignment. Identifica a cada participante únicamente
 * por su código seudonimizado; los identificadores internos no se
 * muestran ni se usan en el DOM. Escape equivale a «Cancelar».
 */
const MONO = 'font-[family-name:var(--font-mono)]';

function selectedLabel(count) {
  if (count === 0) return 'Ningún participante seleccionado';

  return `${count} ${count === 1 ? 'participante seleccionado' : 'participantes seleccionados'}`;
}

export function ParticipantAssignmentPanel({
  headingRef,
  available,
  unavailable,
  isLoadingCandidates,
  catalogError,
  selected,
  selectionError,
  conflicts,
  requestError,
  isSubmitting,
  onToggle,
  onRemove,
  onSubmit,
  onCancel,
  onRetryCatalog,
}) {
  const baseId = useId();
  const headingId = `${baseId}-titulo`;
  const selectionErrorId = `${baseId}-error`;
  const selectedIds = selected.map(({ id }) => id);

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-[var(--space-5)] rounded-[var(--radius-xl)] border border-[var(--brand-500)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-md)]"
    >
      <div className="flex flex-col gap-[var(--space-1)]">
        <h3
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
        >
          <UserPlus size={20} strokeWidth={1.8} aria-hidden="true" />
          Asignar participantes
        </h3>

        <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Selecciona participantes por su código seudonimizado. El estado de
          cada uno en la cohorte lo informa el sistema al asignarlo; esta
          pantalla no lo decide.
        </p>
      </div>

      {isLoadingCandidates && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-2)]">
          <p role="status" className="sr-only">
            Cargando participantes disponibles...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-[48px] animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-hover)] motion-reduce:animate-none"
            />
          ))}
        </div>
      )}

      {!isLoadingCandidates && catalogError && (
        <CohortNotice
          tone="danger"
          icon={AlertTriangle}
          title="Participantes disponibles no cargados"
          role="alert"
          action={
            <Button variant="secondary" onClick={onRetryCatalog}>
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          {catalogError}
        </CohortNotice>
      )}

      {!isLoadingCandidates && !catalogError && (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[var(--space-5)]">
          <fieldset
            className="m-0 flex min-w-0 flex-col gap-[var(--space-2)] border-0 p-0"
            aria-describedby={selectionError ? selectionErrorId : undefined}
          >
            <legend className="mb-[var(--space-2)] p-0 text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">
              Participantes disponibles ({available.length})
            </legend>

            {available.length > 0 ? (
              <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-2)] p-0 sm:grid-cols-2 lg:grid-cols-3">
                {available.map((candidate, index) => (
                  <li key={candidate.id}>
                    <Checkbox
                      id={`${baseId}-opcion-${index}`}
                      checked={selectedIds.includes(candidate.id)}
                      disabled={isSubmitting}
                      onChange={() => onToggle(candidate.id)}
                      className="min-h-[48px] border-[var(--surface-border)]"
                    >
                      <span className={`${MONO} text-[length:var(--font-size-md)] font-semibold`}>
                        {candidate.code?.trim() || 'Código no disponible'}
                      </span>
                    </Checkbox>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                No hay participantes disponibles para esta cohorte.
              </p>
            )}
          </fieldset>

          {unavailable.length > 0 && (
            <div className="flex flex-col gap-[var(--space-2)]">
              <h4 className="m-0 text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">
                No disponibles para esta cohorte
              </h4>
              <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
                {unavailable.map((candidate) => (
                  <li
                    key={candidate.id}
                    className="flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-1)] rounded-[var(--radius-md)] border border-dashed border-[var(--surface-border)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)]"
                  >
                    <CircleSlash size={16} strokeWidth={1.8} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                    <span className={`${MONO} font-semibold text-[var(--text-primary)]`}>{candidate.code}</span>
                    <span className="text-[var(--text-secondary)]">{candidate.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-[var(--space-2)]">
            <p aria-live="polite" className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
              {selectedLabel(selected.length)}
            </p>

            {selected.length > 0 && (
              <ul className="m-0 flex list-none flex-wrap gap-[var(--space-2)] p-0" aria-label="Participantes seleccionados">
                {selected.map(({ id, code, hasIssue }) => (
                  <li
                    key={id}
                    className={`inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border py-[2px] pr-[2px] pl-[var(--space-3)] text-[length:var(--font-size-sm)] ${hasIssue ? 'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]' : 'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-primary)]'}`}
                  >
                    {hasIssue && <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />}
                    <span className={`${MONO} font-semibold`}>{code}</span>
                    {hasIssue && <span className="sr-only"> (no puede asignarse)</span>}
                    <button
                      type="button"
                      onClick={() => onRemove(id)}
                      disabled={isSubmitting}
                      aria-label={`Quitar ${code} de la selección`}
                      className="inline-flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[var(--radius-full)] border-0 bg-transparent text-current hover:bg-[var(--surface-card)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <X size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectionError && (
              <p
                id={selectionErrorId}
                role="alert"
                className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--danger-text)]"
              >
                <AlertTriangle size={16} strokeWidth={1.8} aria-hidden="true" />
                {selectionError}
              </p>
            )}
          </div>

          {requestError && (
            <div
              role="alert"
              className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--danger-text)]"
            >
              <p className="m-0 flex items-start gap-[var(--space-2)]">
                <AlertTriangle size={18} strokeWidth={1.8} className="mt-[1px] shrink-0" aria-hidden="true" />
                <span>
                  <strong className="block">No se asignaron participantes</strong>
                  {requestError}
                </span>
              </p>

              {conflicts.length > 0 && (
                <ul className="m-0 flex list-disc flex-col gap-[var(--space-1)] pl-[var(--space-8)]">
                  {conflicts.map(({ participantId, code, message }) => (
                    <li key={participantId}>
                      <span className={`${MONO} font-semibold`}>{code}</span>: {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p className="m-0 inline-flex items-start gap-[var(--space-2)] text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
            <FlaskConical size={14} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden="true" />
            Los cambios son temporales y no se guardan en el servidor.
          </p>

          <div className="flex flex-col-reverse gap-[var(--space-2)] sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="min-h-[44px]">
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting} loadingText="Asignando..." className="min-h-[44px]">
              <UserPlus size={16} strokeWidth={1.8} aria-hidden="true" />
              Confirmar asignación{selected.length > 0 ? ` (${selected.length})` : ''}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
