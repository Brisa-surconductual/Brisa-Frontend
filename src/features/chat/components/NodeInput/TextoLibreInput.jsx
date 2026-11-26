import { useId } from 'react';

import { contador } from './textoLibre.js';

// D9: Enter hace salto de línea (nativo del <textarea>); se envía con
// "Continuar". D7: sin límite nativo de longitud, que cortaría en
// silencio un texto pegado.
// D11: el texto no sale del estado del formulario.
export function TextoLibreInput({
  entrada,
  valor,
  onCambiar,
  deshabilitado,
  idEtiqueta,
  idDescripcion,
}) {
  const id = useId();
  const idContador = `${id}-contador`;

  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      {/* Crece con el texto donde hay field-sizing; si no, queda resize-y. */}
      <textarea
        rows={4}
        value={valor ?? ''}
        onChange={(evento) => onCambiar(evento.target.value)}
        disabled={deshabilitado}
        aria-labelledby={idEtiqueta}
        aria-describedby={[idContador, idDescripcion].filter(Boolean).join(' ')}
        aria-invalid={idDescripcion ? true : undefined}
        className="max-h-[40vh] min-h-[calc(var(--space-8)*3)] w-full resize-y rounded-[var(--radius-md)] border-[1.5px] border-[var(--text-muted)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)] text-[16px] leading-[1.5] text-[var(--text-primary)] field-sizing-content focus:border-[var(--brand-500)] disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-[var(--danger)]"
      />

      {/* Sin región viva: el conteo se lee al enfocar el campo
          (aria-describedby), no en cada tecla. */}
      <p
        id={idContador}
        className="m-0 text-right font-[family-name:var(--font-mono)] text-[12px] text-[var(--text-secondary)]"
      >
        {contador(entrada, valor)}
      </p>
    </div>
  );
}
