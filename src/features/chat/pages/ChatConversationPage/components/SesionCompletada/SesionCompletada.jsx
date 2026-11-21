import { CircleCheck, House } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

/*
 * RF-31: la sesión terminó (`esTerminal` o estado COMPLETADA). Sustituye
 * al formulario: no se admiten más respuestas y el historial sigue a la
 * vista. El texto es de interfaz y no clínico; el contenido de cierre lo
 * da el nodo terminal (A-016).
 */
export function SesionCompletada({ tituloRef, onVolverInicio }) {
  return (
    <section
      aria-labelledby="sesion-completada-titulo"
      className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--success-border)] bg-[var(--success-bg)] p-[var(--space-4)] shadow-[var(--glass-shadow)] text-[var(--success-text)]"
    >
      <h2
        id="sesion-completada-titulo"
        ref={tituloRef}
        tabIndex={-1}
        className="m-0 flex items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
      >
        <CircleCheck
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
          className="shrink-0"
        />
        Sesión completada
      </h2>

      <p className="m-0 text-[length:var(--font-size-sm)] text-pretty">
        Esta conversación terminó y tus respuestas quedaron guardadas. Ya no se
        pueden agregar respuestas a esta sesión.
      </p>

      <Button variant="secondary" size="large" onClick={onVolverInicio}>
        <House size={20} strokeWidth={1.8} aria-hidden="true" />
        Volver al inicio
      </Button>
    </section>
  );
}
