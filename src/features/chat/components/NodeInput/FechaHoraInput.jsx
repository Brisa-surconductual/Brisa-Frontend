import { useId } from 'react';

import { FORMATO_FECHA } from '../../types/index.js';

import { ayudaFechaHora, formatoDe } from './fechaHora.js';

// D3: controles nativos; en el celular abren el selector del sistema.
const TIPO_NATIVO = Object.freeze({
  FECHA: 'date',
  HORA: 'time',
  FECHA_HORA: 'datetime-local',
});

// ponytail: datetime-local no acepta desfase en min/max; se recorta a
// "YYYY-MM-DDTHH:mm". Es aproximado si el desfase difiere del dispositivo;
// el rango exacto lo valida el backend (ADR-0004).
const limiteNativo = (formato, limite) =>
  formato === FORMATO_FECHA.FECHA_HORA ? limite?.slice(0, 16) : limite;

// Enter envía porque el formulario es un <form> nativo.
export function FechaHoraInput({
  entrada,
  valor,
  onCambiar,
  deshabilitado,
  idEtiqueta,
  idDescripcion,
}) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const formato = formatoDe(entrada);
  const ayuda = ayudaFechaHora(entrada);

  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      {/* El tema oscuro se activa con html[data-theme="dark"] (tokens.css):
          el mismo selector pone el selector nativo en modo oscuro. */}
      <input
        type={TIPO_NATIVO[formato]}
        value={valor ?? ''}
        min={limiteNativo(formato, entrada.min) ?? undefined}
        max={limiteNativo(formato, entrada.max) ?? undefined}
        onChange={(evento) => onCambiar(evento.target.value)}
        disabled={deshabilitado}
        aria-labelledby={idEtiqueta}
        aria-describedby={
          [ayuda && idAyuda, idDescripcion].filter(Boolean).join(' ') ||
          undefined
        }
        aria-invalid={idDescripcion ? true : undefined}
        className="min-h-[44px] w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--text-muted)] bg-[var(--surface-card)] px-[var(--space-4)] text-[16px] text-[var(--text-primary)] focus:border-[var(--brand-500)] disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-[var(--danger)] [html[data-theme='dark']_&]:[color-scheme:dark]"
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
