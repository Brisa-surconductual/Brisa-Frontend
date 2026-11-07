import { ArrowRight, Route } from 'lucide-react';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import { OPERADOR_CONDICION_ETIQUETA } from '../../../../types/operadorCondicion.js';

/* Transiciones en el orden en que se evalúan. Solo lectura. */
export function TreeTransitionList({ transiciones }) {
  return (
    <section
      aria-labelledby="transiciones-titulo"
      className="flex flex-col gap-[var(--space-3)]"
    >
      <h2
        id="transiciones-titulo"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        Transiciones
        <span className="ml-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
          ({transiciones.length})
        </span>
      </h2>

      {transiciones.length === 0 ? (
        <ChatAdminNotice tone="neutral" icon={Route}>
          Este flujo aún no tiene transiciones.
        </ChatAdminNotice>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0">
          {transiciones.map((transicion) => (
            <li
              key={transicion.id}
              className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]"
            >
              <p className="m-0 flex flex-wrap items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
                <span>{transicion.origen}</span>
                <ArrowRight
                  size={16}
                  strokeWidth={2}
                  className="shrink-0 text-[var(--brand-600)]"
                  aria-label="lleva a"
                />
                <span>{transicion.destino}</span>
              </p>

              <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                {OPERADOR_CONDICION_ETIQUETA[transicion.operador] ??
                  transicion.operador}
                {transicion.condicion && ` · ${transicion.condicion}`}
                {` · Evaluación ${transicion.ordenEvaluacion}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
