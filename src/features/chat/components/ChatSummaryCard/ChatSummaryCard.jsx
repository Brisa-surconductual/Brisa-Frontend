import { Flag } from 'lucide-react';

// Cierre de día o semana (nodo RESUMEN). `titulo` es opcional en el contrato.
export function ChatSummaryCard({ titulo, texto }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)] shadow-[var(--shadow-sm)]">
      {titulo && (
        <p className="m-0 flex items-center gap-[var(--space-2)] whitespace-pre-line text-[13px] font-bold text-[var(--text-primary)]">
          <Flag
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0 text-[var(--brand-600)]"
          />
          {titulo}
        </p>
      )}

      <p className="mt-[var(--space-1)] mb-0 whitespace-pre-line text-[13px] leading-[1.6] text-[var(--text-secondary)]">
        {texto}
      </p>
    </article>
  );
}
