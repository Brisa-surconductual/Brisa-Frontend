import { Smile } from 'lucide-react';

// RF-26: texto e instrucciones se pintan tal cual llegan, como texto plano.
// Todo mensaje del nodo es de Brisa.
export function ChatMessageBubble({ texto, instrucciones }) {
  return (
    <div className="flex items-end gap-[var(--space-2)]">
      <span className="flex size-[var(--space-6)] shrink-0 items-center justify-center rounded-[var(--radius-full)] border border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]">
        <Smile size={14} strokeWidth={1.75} aria-hidden="true" />
      </span>

      <div className="max-w-[78%] rounded-[var(--radius-lg)] rounded-bl-[var(--radius-sm)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-3)] py-[var(--space-2)] text-[13px] leading-[1.55] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
        <p className="m-0 whitespace-pre-line">
          <span className="sr-only">Brisa: </span>
          {texto}
        </p>

        {instrucciones && (
          <p className="mt-[var(--space-1)] mb-0 whitespace-pre-line text-[12px] text-[var(--text-secondary)]">
            {instrucciones}
          </p>
        )}
      </div>
    </div>
  );
}
