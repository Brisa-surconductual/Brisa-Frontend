// Recibe el texto ya listo para mostrar; formatear la respuesta es de FE-M03-02.
export function UserAnswerBubble({ texto }) {
  return (
    <div className="flex justify-end">
      <p className="m-0 max-w-[78%] whitespace-pre-line rounded-[var(--radius-lg)] rounded-br-[var(--radius-sm)] border border-[var(--brand-500)] bg-[var(--brand-500)] px-[var(--space-3)] py-[var(--space-2)] text-[13px] leading-[1.55] text-[var(--text-inverse)] shadow-[var(--shadow-sm)]">
        <span className="sr-only">Tú: </span>
        {texto}
      </p>
    </div>
  );
}
