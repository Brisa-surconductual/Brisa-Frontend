import { BotonOpcion } from './BotonOpcion.jsx';

// Botones normales: tocar una opción la elige y el formulario la envía.
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
      {entrada.opciones.map((opcion) => (
        <BotonOpcion
          key={String(opcion.valor)}
          elegida={valor === opcion.valor}
          disabled={deshabilitado}
          onClick={() => onCambiar(opcion.valor)}
        >
          {opcion.etiqueta}
        </BotonOpcion>
      ))}
    </div>
  );
}
