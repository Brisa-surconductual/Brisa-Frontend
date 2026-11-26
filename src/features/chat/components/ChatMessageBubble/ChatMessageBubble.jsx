import { Smile } from 'lucide-react';

import { GLASS } from '../../utils/glass.js';

// RF-26: texto e instrucciones se pintan tal cual llegan, como texto plano.
// Todo mensaje del nodo es de Brisa.
export function ChatMessageBubble({ texto, instrucciones }) {
  return (
    <div className="flex items-end gap-[var(--space-2)]">
      <span
        className={`flex size-[var(--space-6)] shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[var(--brand-700)] ${GLASS.panel}`}
      >
        <Smile size={14} strokeWidth={1.75} aria-hidden="true" />
      </span>

      <div
        className={`max-w-[78%] rounded-[var(--radius-xl)] rounded-bl-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-3)] text-[13px] leading-[1.55] text-[var(--text-primary)] ${GLASS.panelTexto}`}
      >
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
