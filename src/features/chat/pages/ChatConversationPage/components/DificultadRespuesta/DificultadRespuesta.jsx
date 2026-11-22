import { LifeBuoy } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

export const TEXTO_DIFICULTAD =
  'Parece que estás teniendo dificultades con esta pregunta. Si lo necesitas, puedes pedir ayuda para continuar.';

// No hay todavía un flujo de ayuda en el chat (SOS de RF-43 pendiente) ni
// un endpoint para solicitarla: «Pedir ayuda» orienta sin inventar rutas.
// La respuesta sigue editable y la pregunta no se omite (A5 pendiente).
export const TEXTO_AYUDA =
  'Comunícate con el equipo de psicología que acompaña tu programa para recibir ayuda con esta pregunta. Mientras tanto, tu respuesta sigue abierta: puedes revisar la pregunta e intentarlo de nuevo cuando quieras.';

/*
 * RF-37: tras tres respuestas rechazadas por validación en el mismo nodo.
 * Aviso informativo, no de error: el formulario sigue debajo.
 */
export function DificultadRespuesta({ ayudaSolicitada, onPedirAyuda }) {
  return (
    <section
      aria-labelledby="dificultad-respuesta-texto"
      className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-3)] shadow-[var(--glass-shadow)] text-[length:var(--font-size-sm)] text-[var(--info-text)]"
    >
      <p
        id="dificultad-respuesta-texto"
        className="m-0 flex items-start gap-[var(--space-2)]"
      >
        <LifeBuoy
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className="shrink-0"
        />
        <span className="text-pretty">{TEXTO_DIFICULTAD}</span>
      </p>

      {ayudaSolicitada ? (
        <p role="status" className="m-0 text-pretty">
          {TEXTO_AYUDA}
        </p>
      ) : (
        <Button
          variant="secondary"
          size="large"
          onClick={onPedirAyuda}
          className="self-start"
        >
          Pedir ayuda
        </Button>
      )}
    </section>
  );
}
