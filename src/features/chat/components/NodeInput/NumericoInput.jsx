import { useId } from 'react';

import { ayudaNumerico, modoTeclado } from './numerico.js';

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
  const idAyuda = `${id}-ayuda`;
  const ayuda = ayudaNumerico(entrada);

  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <input
        type="text"
        inputMode={modoTeclado(entrada)}
        autoComplete="off"
        value={valor ?? ''}
        onChange={(evento) => onCambiar(evento.target.value)}
        disabled={deshabilitado}
        aria-labelledby={idEtiqueta}
        aria-describedby={
          [ayuda && idAyuda, idDescripcion].filter(Boolean).join(' ') ||
          undefined
        }
        aria-invalid={idDescripcion ? true : undefined}
        className="min-h-[44px] w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--text-muted)] bg-[var(--surface-card)] px-[var(--space-4)] text-[16px] text-[var(--text-primary)] focus:border-[var(--brand-500)] disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-[var(--danger)]"
      />

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
