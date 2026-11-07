import { Flag, MessageSquare, Pencil } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';

/*
 * Nodos del flujo, con el inicial al principio. Solo lectura: el texto
 * se muestra tal cual lo definió el equipo de psicología.
 */
export function TreeNodeList({ nodos, canEdit = false, onEdit }) {
  return (
    <section
      aria-labelledby="nodos-titulo"
      className="flex flex-col gap-[var(--space-3)]"
    >
      <h2
        id="nodos-titulo"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        Nodos
        <span className="ml-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
          ({nodos.length})
        </span>
      </h2>

      {nodos.length === 0 ? (
        <ChatAdminNotice tone="neutral" icon={MessageSquare}>
          Este flujo aún no tiene nodos.
        </ChatAdminNotice>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0">
          {nodos.map((nodo) => (
            <li
              key={nodo.id}
              className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]"
            >
              <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                <span className="rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-2)] py-[2px] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]">
                  {nodo.tipoNodo}
                </span>

                {nodo.esNodoInicial && (
                  <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--info-border)] bg-[var(--info-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--info-text)]">
                    <Flag size={13} strokeWidth={2} aria-hidden="true" />
                    Nodo inicial
                  </span>
                )}

                {nodo.orden !== null && (
                  <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
                    Orden {nodo.orden}
                  </span>
                )}

                {canEdit && (
                  <Button
                    variant="ghost"
                    size="small"
                    className="ml-auto"
                    aria-label={`Editar ${nodo.etiqueta}`}
                    onClick={() => onEdit(nodo)}
                  >
                    <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
                    Editar
                  </Button>
                )}
              </div>

              <p className="m-0 text-[length:var(--font-size-base)] leading-[var(--line-height-normal)] [overflow-wrap:anywhere] whitespace-pre-line text-[var(--text-primary)]">
                {nodo.texto || 'Sin texto.'}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
