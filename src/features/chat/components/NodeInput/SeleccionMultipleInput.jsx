import { useId } from 'react';
import { Square, SquareCheck } from 'lucide-react';

import { BotonOpcion } from './BotonOpcion.jsx';
import { alternarSeleccion, textoAyuda } from './seleccionMultiple.js';

export function SeleccionMultipleInput({
  entrada,
  valor,
  onCambiar,
  deshabilitado,
  idEtiqueta,
  idDescripcion,
}) {
  const idAyuda = useId();
  const seleccion = valor ?? [];
  const { max_selecciones: max } = entrada;
  const lleno = seleccion.length >= (max ?? Infinity);
  const ayuda = textoAyuda(entrada.min_selecciones, max);

  return (
    <div
      role="group"
      aria-labelledby={idEtiqueta}
      aria-describedby={
        [ayuda && idAyuda, idDescripcion].filter(Boolean).join(' ') || undefined
      }
      className="flex flex-col gap-[var(--space-2)]"
    >
      {ayuda && (
        <p
          id={idAyuda}
          className="m-0 text-[12px] text-[var(--text-secondary)]"
        >
          {ayuda}
        </p>
      )}

      {entrada.opciones.map((opcion) => {
        const elegida = seleccion.includes(opcion.valor);
        const Casilla = elegida ? SquareCheck : Square;
        return (
          <BotonOpcion
            key={opcion.valor}
            role="checkbox"
            aria-checked={elegida}
            elegida={elegida}
            disabled={deshabilitado || (lleno && !elegida)}
            onClick={() =>
              onCambiar(alternarSeleccion(seleccion, opcion.valor, max))
            }
          >
            <Casilla
              size={18}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0"
            />
            {opcion.etiqueta}
          </BotonOpcion>
        );
      })}
    </div>
  );
}
