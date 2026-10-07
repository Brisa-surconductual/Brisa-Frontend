import { Info, Smile } from 'lucide-react';

import { EMISOR } from '../../types/index.js';

// RF-26: texto e instrucciones se pintan tal cual llegan, como texto plano.
export function ChatMessageBubble({ emisor, texto, instrucciones }) {
  const esSistema = emisor === EMISOR.SISTEMA;
  const Icono = esSistema ? Info : Smile;

  const iconoClass = esSistema
    ? 'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]'
    : 'border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]';

  const burbujaClass = esSistema
    ? 'border-dashed bg-[var(--surface-hover)] text-[12px] italic text-[var(--text-secondary)]'
    : 'bg-[var(--surface-card)] text-[13px] text-[var(--text-primary)]';

  return (
    <div className="flex items-end gap-[var(--space-2)]">
      <span
        className={`flex size-[var(--space-6)] shrink-0 items-center justify-center rounded-[var(--radius-full)] border ${iconoClass}`}
      >
        <Icono size={14} strokeWidth={1.75} aria-hidden="true" />
      </span>

      <div
        className={`max-w-[78%] rounded-[var(--radius-lg)] rounded-bl-[var(--radius-sm)] border border-[var(--surface-border)] px-[var(--space-3)] py-[var(--space-2)] leading-[1.55] shadow-[var(--shadow-sm)] ${burbujaClass}`}
      >
        <p className="m-0 whitespace-pre-line">
          <span className="sr-only">{esSistema ? 'Sistema: ' : 'Brisa: '}</span>
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
