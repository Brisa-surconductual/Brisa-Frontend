import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';

const EMPTY_MODULES = Object.freeze([]);

export function DestinationModuleSelector({
  modules = EMPTY_MODULES,
  selectedModuleIds = EMPTY_MODULES,
  error = '',
  disabled = false,
  onToggle,
}) {
  const errorId = 'destination-modules-error';

  return (
    <fieldset
      className="m-0 min-w-0 border-0 p-0"
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]">
        Módulos destino
        <span
          className="text-[var(--danger-text)]"
          aria-hidden="true"
        >
          *
        </span>
      </legend>

      <p className="mt-[var(--space-1)] mb-[var(--space-3)] text-[11px] leading-[1.5] text-[var(--text-muted)]">
        Selecciona al menos un módulo en el que estará
        disponible este recurso.
      </p>

      {modules.length === 0 ? (
        <div
          className="rounded-[var(--radius-md)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-hover)] p-[var(--space-4)]"
          role="status"
        >
          <p className="m-0 text-[12px] text-[var(--text-muted)]">
            No hay módulos destino disponibles.
          </p>
        </div>
      ) : (
        <div className="grid gap-[var(--space-2)] sm:grid-cols-2">
          {modules.map((module) => {
            const checked =
              selectedModuleIds.includes(module.id);

            return (
              <Checkbox
                key={module.id}
                id={`destination-module-${module.id}`}
                checked={checked}
                disabled={disabled}
                aria-describedby={
                  error ? errorId : undefined
                }
                onChange={() => onToggle?.(module.id)}
              >
                <span className="flex flex-col gap-[2px]">
                  <span className="font-semibold">
                    {module.name}
                  </span>

                  {module.code && (
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {module.code}
                    </span>
                  )}
                </span>
              </Checkbox>
            );
          })}
        </div>
      )}

      {error && (
        <p
          id={errorId}
          className="mt-[var(--space-2)] mb-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}