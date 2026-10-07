import { useId } from 'react';

import { ayudaNumerico } from './numerico.js';

// type="text" y no "number": el campo nativo acepta "e", cambia con la
// rueda del ratón y trata la coma según el idioma del navegador.
// Enter envía porque el formulario es un <form> nativo.
export function NumericoInput({
  entrada,
  valor,
  onCambiar,
  deshabilitado,
  idEtiqueta,
  idDescripcion,
}) {
  const id = useId();
  const idUnidad = `${id}-unidad`;
  const idAyuda = `${id}-ayuda`;
  const { unidad, decimales } = entrada;
  const ayuda = ayudaNumerico(entrada);

  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <div className="flex items-center gap-[var(--space-2)]">
        <input
          type="text"
          inputMode={decimales > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          value={valor ?? ''}
          onChange={(evento) => onCambiar(evento.target.value)}
          disabled={deshabilitado}
          aria-labelledby={idEtiqueta}
          aria-describedby={
            [unidad && idUnidad, ayuda && idAyuda, idDescripcion]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-invalid={idDescripcion ? true : undefined}
          className="min-h-[44px] min-w-0 flex-1 rounded-[var(--radius-md)] border-[1.5px] border-[var(--text-muted)] bg-[var(--surface-card)] px-[var(--space-4)] text-[16px] text-[var(--text-primary)] focus:border-[var(--brand-500)] disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-[var(--danger)]"
        />
        {unidad && (
          <span
            id={idUnidad}
            className="text-[13px] font-semibold text-[var(--text-secondary)]"
          >
            {unidad}
          </span>
        )}
      </div>

      {ayuda && (
        <p
          id={idAyuda}
          className="m-0 text-[12px] text-[var(--text-secondary)]"
        >
          {ayuda}
        </p>
      )}
    </div>
  );
}
