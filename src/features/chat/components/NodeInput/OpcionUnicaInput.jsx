import { Check } from 'lucide-react';

import { BotonOpcion } from './BotonOpcion.jsx';

// Botones normales: tocar una opción la elige y el formulario la envía.
// D18: sin aria-pressed, porque no son botones de alternar (FE-M03-02a).
// La elegida lleva un ícono además del color (el color nunca es la única
// señal de estado); `data-elegida` solo sirve para devolverle el foco.
export function OpcionUnicaInput({
  entrada,
  valor,
  onCambiar,
  deshabilitado,
  idEtiqueta,
  idDescripcion,
}) {
  return (
    <div
      role="group"
      aria-labelledby={idEtiqueta}
      aria-describedby={idDescripcion}
      aria-invalid={idDescripcion ? true : undefined}
      className="flex flex-col gap-[var(--space-2)]"
    >
      {(entrada.opciones ?? []).map((opcion) => {
        const elegida = valor === opcion.valor;
        return (
          <BotonOpcion
            key={String(opcion.valor)}
            data-elegida={elegida || undefined}
            elegida={elegida}
            disabled={deshabilitado}
            onClick={() => onCambiar(opcion.valor)}
          >
            {elegida && (
              <Check
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0"
              />
            )}
            {opcion.etiqueta}
          </BotonOpcion>
        );
      })}
    </div>
  );
}
