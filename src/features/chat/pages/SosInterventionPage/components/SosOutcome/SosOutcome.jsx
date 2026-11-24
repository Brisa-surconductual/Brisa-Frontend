import { CircleCheck, Info } from 'lucide-react';

import { formatearDuracion } from '../../../../services/sos/tiempoSos.js';
import { ESTADO_INTERVENCION_SOS_LABEL } from '../../../../types/sos.js';

const TEXTO_ESTADO_DESCONOCIDO =
  'No pudimos confirmar cómo terminó el ejercicio.';

/*
 * RF-43: estado y duración definitivos, tal como los devolvió el backend.
 * Si el backend ya lo había cerrado, no se inventa un resultado: se
 * muestra su mensaje.
 */
export function SosOutcome({
  resultado,
  estadoDesconocido,
  mensaje,
  outcomeRef,
}) {
  const titulo = estadoDesconocido
    ? TEXTO_ESTADO_DESCONOCIDO
    : (ESTADO_INTERVENCION_SOS_LABEL[resultado?.estado] ?? resultado?.estado);
  const duracion = estadoDesconocido
    ? null
    : formatearDuracion(resultado?.duracionSegundos);
  const Icono = estadoDesconocido ? Info : CircleCheck;

  return (
    <section
      ref={outcomeRef}
      tabIndex={-1}
      role="status"
      className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
    >
      <Icono
        size={24}
        strokeWidth={1.8}
        aria-hidden="true"
        className="shrink-0 text-[var(--brand-600)]"
      />
      <div className="flex flex-col gap-[var(--space-1)]">
        <h2 className="m-0 text-[length:var(--font-size-base)] font-extrabold text-[var(--text-primary)]">
          {titulo}
        </h2>
        {duracion && (
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
            Duración registrada: {duracion}
          </p>
        )}
        {estadoDesconocido && mensaje && (
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
            {mensaje}
          </p>
        )}
      </div>
    </section>
  );
}
