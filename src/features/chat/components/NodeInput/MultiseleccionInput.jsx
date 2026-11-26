import { useId } from 'react';
import { Square, SquareCheck } from 'lucide-react';

import { BotonOpcion } from './BotonOpcion.jsx';
import { alternarSeleccion, textoAyuda } from './multiseleccion.js';

export function MultiseleccionInput({
  entrada,
  valor,
  onCambiar,
  deshabilitado,
  idEtiqueta,
  idDescripcion,
}) {
  const idAyuda = useId();
  const seleccion = valor ?? [];
  const ayuda = textoAyuda(entrada.min, entrada.max);

  return (
    <div
      role="group"
      aria-labelledby={idEtiqueta}
      aria-describedby={
        [ayuda && idAyuda, idDescripcion].filter(Boolean).join(' ') || undefined
      }
      aria-invalid={idDescripcion ? true : undefined}
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

      {(entrada.opciones ?? []).map((opcion) => {
        const elegida = seleccion.includes(opcion.valor);
        const Casilla = elegida ? SquareCheck : Square;
        return (
          <BotonOpcion
            key={opcion.valor}
            role="checkbox"
            aria-checked={elegida}
            elegida={elegida}
            disabled={deshabilitado}
            onClick={() =>
              onCambiar(alternarSeleccion(seleccion, opcion.valor))
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
