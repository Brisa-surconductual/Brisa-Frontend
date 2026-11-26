/*
 * RF-25 · Grupo de interruptores deslizantes excluyentes: solo uno puede
 * estar activo. Activar uno apaga el anterior; tocar el activo lo apaga
 * (valor ''). Cada interruptor es un `role="switch"` con su etiqueta
 * visible, y el estado se comunica con texto ("Activado") además del color.
 */
export function ExclusiveSwitchGroup({
  id,
  legend,
  options,
  value,
  error,
  hint,
  disabled = false,
  onChange,
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <fieldset
      id={id}
      aria-describedby={
        [hintId, errorId].filter(Boolean).join(' ') || undefined
      }
      className="m-0 flex flex-col gap-[var(--space-2)] border-0 p-0"
    >
      <legend className="mb-[var(--space-2)] p-0 text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">
        {legend}
      </legend>

      {options.map((opcion) => {
        const activo = value === opcion.value;
        return (
          <button
            key={opcion.value}
            type="button"
            role="switch"
            aria-checked={activo}
            disabled={disabled}
            onClick={() => onChange(activo ? '' : opcion.value)}
            className="flex min-h-[44px] w-full items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--font-size-sm)] text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex flex-col">
              <span className="font-bold">{opcion.label}</span>
              <span className="text-[var(--text-secondary)]">
                {activo ? 'Activado' : 'Desactivado'}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-[24px] w-[44px] shrink-0 items-center rounded-[var(--radius-full)] transition-colors ${
                activo
                  ? 'bg-[var(--brand-600)]'
                  : 'bg-[var(--button-secondary-border)]'
              }`}
            >
              <span
                className={`absolute h-[20px] w-[20px] rounded-[var(--radius-full)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)] transition-transform ${
                  activo ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}
              />
            </span>
          </button>
        );
      })}

      {hint && (
        <p
          id={hintId}
          className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="m-0 text-[length:var(--font-size-sm)] font-bold text-[var(--danger-text)]"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
