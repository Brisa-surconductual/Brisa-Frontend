import { Check } from 'lucide-react';

import { BotonOpcion } from './BotonOpcion.jsx';

// Botones normales: tocar una opción la elige y el formulario la envía.
// La elegida lleva un ícono además del color (el color nunca es la única
// señal de estado).
export function SeleccionUnicaInput({
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
      className="flex flex-col gap-[var(--space-2)]"
    >
      {entrada.opciones.map((opcion) => {
        const elegida = valor === opcion.valor;
        return (
          <BotonOpcion
            key={String(opcion.valor)}
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
