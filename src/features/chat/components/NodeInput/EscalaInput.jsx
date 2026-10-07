import { useId } from 'react';

import { conComa } from './escala.js';

const TECLAS_NAVEGACION = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
];

// Clases literales: Tailwind solo genera las que encuentra escritas.
// Área táctil de 44 px, pista de 6 px y thumb de 24 px (--space-6).
// Pista en --text-muted para llegar a 3:1 de contraste en ambos temas.
const RANGE_CLASS = [
  'h-[44px] w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-45',
  '[&::-webkit-slider-runnable-track]:h-[6px] [&::-webkit-slider-runnable-track]:rounded-[var(--radius-full)] [&::-webkit-slider-runnable-track]:bg-[var(--text-muted)]',
  '[&::-moz-range-track]:h-[6px] [&::-moz-range-track]:rounded-[var(--radius-full)] [&::-moz-range-track]:bg-[var(--text-muted)]',
  '[&::-webkit-slider-thumb]:mt-[-9px] [&::-webkit-slider-thumb]:size-[var(--space-6)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[var(--radius-full)] [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[var(--brand-500)]',
  '[&::-moz-range-thumb]:size-[var(--space-6)] [&::-moz-range-thumb]:rounded-[var(--radius-full)] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--brand-500)]',
].join(' ');

// Sin valor por defecto: con `valor` null el control se dibuja en `min`,
// atenuado y con "Sin elegir", y el formulario sigue en null.
export function EscalaInput({
  entrada,
  valor,
  onCambiar,
  deshabilitado,
  idEtiqueta,
  idDescripcion,
}) {
  const id = useId();
  const idExtremos = `${id}-extremos`;
  const idAviso = `${id}-aviso`;
  const sinValor = valor == null;
  const { min, max, paso = 1, etiqueta_min, etiqueta_max } = entrada;
  const posiciones = Math.round((max - min) / paso) + 1;
  const marcas =
    posiciones <= 11
      ? Array.from({ length: posiciones }, (_, i) =>
          Number((min + i * paso).toFixed(9)),
        )
      : [min, max];

  // El range nativo no dispara `change` si el valor no cambia: hacer clic
  // o tocar sobre la posición actual, o usar una tecla en un extremo,
  // también elige ese valor. `click` y no `pointerup`: solo cuenta si la
  // pulsación empieza y termina en el control.
  const elegir = (evento) => {
    if (!deshabilitado) onCambiar(Number(evento.currentTarget.value));
  };

  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <p
        className={`m-0 text-center font-[family-name:var(--font-mono)] text-[20px] font-extrabold ${sinValor ? 'text-[var(--text-secondary)]' : 'text-[var(--brand-600)]'}`}
      >
        {sinValor ? 'Sin elegir' : conComa(valor)}
      </p>
      {sinValor && (
        <p
          id={idAviso}
          className="m-0 text-center text-[12px] text-[var(--text-secondary)]"
        >
          Desliza para elegir
        </p>
      )}

      <div
        id={idExtremos}
        className="flex justify-between text-[10.5px] font-semibold text-[var(--text-secondary)]"
      >
        <span>{etiqueta_min}</span>
        <span>{etiqueta_max}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor ?? min}
        disabled={deshabilitado}
        aria-labelledby={idEtiqueta}
        aria-describedby={[sinValor && idAviso, idExtremos, idDescripcion]
          .filter(Boolean)
          .join(' ')}
        aria-valuetext={sinValor ? 'Sin elegir' : conComa(valor)}
        onChange={elegir}
        onClick={elegir}
        onKeyUp={(evento) => {
          if (TECLAS_NAVEGACION.includes(evento.key)) elegir(evento);
        }}
        className={`${RANGE_CLASS} ${sinValor ? 'opacity-80' : ''}`}
      />

      {/* ponytail: marcas alineadas con el centro del thumb (padding de medio
          thumb); en anchos extremos la alineación es aproximada */}
      <div
        aria-hidden="true"
        className="flex justify-between px-[calc(var(--space-6)/2)] font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-secondary)]"
      >
        {marcas.map((marca) => (
          <span key={marca} className="flex w-0 justify-center">
            {conComa(marca)}
          </span>
        ))}
      </div>
    </div>
  );
}
