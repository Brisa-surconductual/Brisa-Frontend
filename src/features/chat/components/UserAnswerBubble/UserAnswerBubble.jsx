import { GLASS } from '../../utils/glass.js';

// Recibe el texto ya listo para mostrar; formatear la respuesta es de FE-M03-02.
export function UserAnswerBubble({ texto }) {
  return (
    <div className="flex justify-end">
      <p
        className={`m-0 max-w-[78%] whitespace-pre-line rounded-[var(--radius-xl)] rounded-br-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-3)] text-[13px] leading-[1.55] font-medium ${GLASS.marca}`}
      >
        <span className="sr-only">Tú: </span>
        {texto}
      </p>
    </div>
  );
}
