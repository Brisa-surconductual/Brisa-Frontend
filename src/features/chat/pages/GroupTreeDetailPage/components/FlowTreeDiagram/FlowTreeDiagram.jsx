import { AlertTriangle, Route } from 'lucide-react';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import { buildTreeLayout, CAJA_ALTO, CAJA_ANCHO } from './buildTreeLayout.js';

/*
 * Árbol visual del flujo (RF-25, PR4): cada nodo es una caja con su
 * etiqueta, ubicada por las transiciones reales desde el nodo inicial
 * (nunca por `orden`, que no define navegación). Seleccionar una caja abre
 * ese nodo en el editor. Los nodos sin ninguna transición que los alcance
 * se muestran aparte, en naranja, igual que los marca el backend al
 * publicar (RF-25, GRAFO_INVALIDO → nodos_huerfanos).
 */
export function FlowTreeDiagram({ nodos, transiciones, onSelectNodo }) {
  if (!nodos || nodos.length === 0) {
    return (
      <ChatAdminNotice tone="neutral" icon={Route}>
        Este flujo aún no tiene nodos.
      </ChatAdminNotice>
    );
  }

  const layout = buildTreeLayout(nodos, transiciones ?? []);

  return (
    <section
      aria-labelledby="arbol-flujo-titulo"
      className="flex flex-col gap-[var(--space-3)]"
    >
      <h2
        id="arbol-flujo-titulo"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        Árbol del flujo
      </h2>

      {layout.hayHuerfanos && (
        <ChatAdminNotice tone="warning" icon={AlertTriangle} role="status">
          Los nodos en naranja no tienen ninguna transición que los alcance
          desde el nodo inicial. El flujo no se podrá publicar mientras sigan
          así.
        </ChatAdminNotice>
      )}

      <div className="w-full overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-5)]">
        <div
          className="relative"
          style={{
            width: Math.max(layout.ancho, CAJA_ANCHO),
            height: Math.max(layout.alto, CAJA_ALTO),
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={Math.max(layout.ancho, CAJA_ANCHO)}
            height={Math.max(layout.alto, CAJA_ALTO)}
            aria-hidden="true"
          >
            <defs>
              <marker
                id="flecha-transicion"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="var(--brand-500)" />
              </marker>
            </defs>

            {layout.aristas.map((arista) => (
              <line
                key={arista.id}
                x1={arista.x1}
                y1={arista.y1}
                x2={arista.x2}
                y2={arista.y2}
                stroke="var(--brand-500)"
                strokeWidth={2}
                markerEnd="url(#flecha-transicion)"
              />
            ))}
          </svg>

          {layout.cajas.map(({ nodo, x, y, huerfano }) => (
            <button
              key={nodo.id}
              type="button"
              onClick={() => onSelectNodo?.(nodo)}
              aria-label={`Ir al nodo ${nodo.etiqueta}`}
              className={`absolute flex flex-col items-start justify-center gap-[2px] overflow-hidden rounded-[var(--radius-lg)] border-[1.5px] px-[var(--space-3)] py-[var(--space-2)] text-left shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-150 hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)] focus-visible:outline focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)] motion-reduce:transition-none ${
                huerfano
                  ? 'border-[var(--warning-border)] bg-[var(--warning-bg)]'
                  : nodo.esNodoInicial
                    ? 'border-[var(--info-border)] bg-[var(--info-bg)]'
                    : 'border-[var(--surface-border)] bg-[var(--surface-card)] hover:border-[var(--brand-400)]'
              }`}
              style={{ left: x, top: y, width: CAJA_ANCHO, height: CAJA_ALTO }}
            >
              <span className="text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)]">
                {nodo.esNodoInicial
                  ? 'Nodo inicial'
                  : huerfano
                    ? 'Sin conexión'
                    : nodo.tipoNodo}
              </span>
              <span className="w-full truncate text-[length:var(--font-size-sm)] font-semibold text-[var(--text-primary)]">
                {nodo.etiqueta}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
