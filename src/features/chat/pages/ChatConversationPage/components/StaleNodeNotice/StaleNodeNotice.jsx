import { Info } from 'lucide-react';

// D15: 409 NODO_DESACTUALIZADO. Aviso informativo (no de peligro) con el
// `mensaje` del backend tal cual; sin mensaje no se pinta nada.
export function StaleNodeNotice({ mensaje }) {
  if (!mensaje) return null;

  return (
    <p
      role="status"
      className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--info-text)]"
    >
      <Info
        size={20}
        strokeWidth={1.75}
        aria-hidden="true"
        className="shrink-0"
      />
      <span className="text-pretty">{mensaje}</span>
    </p>
  );
}
