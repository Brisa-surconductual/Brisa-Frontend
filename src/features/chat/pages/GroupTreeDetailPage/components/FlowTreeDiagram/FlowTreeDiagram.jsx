import {
  AlertTriangle,
  Flag,
  FlagTriangleRight,
  Leaf,
  Route,
} from 'lucide-react';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import {
  buildTreeLayout,
  CAJA_ALTO,
  CAJA_ANCHO,
  TIPO_RAMA,
} from './buildTreeLayout.js';

// Trazo de cada tipo de rama: el color nunca es la única señal (la
// etiqueta de la rama y la leyenda lo dicen en texto).
const TRAZO_RAMA = Object.freeze({
  [TIPO_RAMA.REGLA]: { dash: undefined, ancho: 2 },
  [TIPO_RAMA.POR_DEFECTO]: { dash: '7 5', ancho: 2 },
  [TIPO_RAMA.IMPLICITA]: { dash: '2 5', ancho: 2 },
});

// Hoja: esquinas redondeadas en diagonal.
const FORMA_HOJA =
  'rounded-tl-[var(--radius-2xl)] rounded-br-[var(--radius-2xl)] rounded-tr-[var(--radius-sm)] rounded-bl-[var(--radius-sm)]';

function estiloHoja(nodo, huerfano) {
  if (huerfano) return 'border-[var(--warning-border)] bg-[var(--warning-bg)]';
  if (nodo.esNodoInicial)
    return 'border-[var(--info-border)] bg-[var(--info-bg)]';
  if (nodo.esNodoFinal)
    return 'border-[var(--success-border)] bg-[var(--success-bg)]';
  return 'border-[var(--surface-border)] bg-[var(--surface-card)] hover:border-[var(--brand-400)]';
}

function RotuloHoja({ nodo, huerfano }) {
  if (huerfano) return 'Sin conexión';
  if (nodo.esNodoInicial) {
    return (
      <>
        <Flag size={12} strokeWidth={2} aria-hidden="true" />
        Nodo inicial
      </>
    );
  }
  if (nodo.esNodoFinal) {
    return (
      <>
        <FlagTriangleRight size={12} strokeWidth={2} aria-hidden="true" />
        Nodo final
      </>
    );
  }
  return (
    <>
      <Leaf size={12} strokeWidth={1.8} aria-hidden="true" />
      {nodo.tipoNodo}
    </>
  );
}

function Leyenda() {
  const muestra = (dash) => (
    <svg width="28" height="8" aria-hidden="true">
      <line
        x1="0"
        y1="4"
        x2="28"
        y2="4"
        stroke="var(--brand-500)"
        strokeWidth="2"
        strokeDasharray={dash}
      />
    </svg>
  );
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-[var(--space-4)] gap-y-[var(--space-1)] p-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
      <li className="inline-flex items-center gap-[var(--space-1)]">
        {muestra(undefined)} Rama con regla (en orden de evaluación)
      </li>
      <li className="inline-flex items-center gap-[var(--space-1)]">
        {muestra('7 5')} Cualquier otra respuesta
      </li>
      <li className="inline-flex items-center gap-[var(--space-1)]">
        {muestra('2 5')} Automática (siguiente por orden)
      </li>
    </ul>
  );
}

/*
 * RF-25 · Flujo del árbol: cada nodo es una hoja y cada transición una
 * rama. La raíz (nodo inicial) va arriba y el nodo final abajo; cada hoja
 * queda bajo la rama que la alcanza primero. Las ramas llevan su regla y su
 * orden de evaluación. Seleccionar una hoja abre ese nodo en el editor. Los
 * nodos sin ninguna rama que los alcance se muestran aparte, en naranja,
 * igual que los marca el backend al publicar (GRAFO_INVALIDO).
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
  const ancho = Math.max(layout.ancho, CAJA_ANCHO);
  const alto = Math.max(layout.alto, CAJA_ALTO);

  return (
    <section
      aria-labelledby="arbol-flujo-titulo"
      className="flex flex-col gap-[var(--space-3)]"
    >
      <h2
        id="arbol-flujo-titulo"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        Flujo del árbol
      </h2>

      <Leyenda />

      {layout.hayHuerfanos && (
        <ChatAdminNotice tone="warning" icon={AlertTriangle} role="status">
          Los nodos en naranja no tienen ninguna transición que los alcance
          desde el nodo inicial. El flujo no se podrá publicar mientras sigan
          así.
        </ChatAdminNotice>
      )}

      <div className="w-full overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-5)]">
        <div className="relative" style={{ width: ancho, height: alto }}>
          <svg
            className="pointer-events-none absolute inset-0"
            width={ancho}
            height={alto}
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
              <path
                key={arista.id}
                d={arista.d}
                fill="none"
                stroke="var(--brand-500)"
                strokeWidth={TRAZO_RAMA[arista.tipo].ancho}
                strokeDasharray={TRAZO_RAMA[arista.tipo].dash}
                strokeLinecap="round"
                markerEnd="url(#flecha-transicion)"
              />
            ))}
          </svg>

          {layout.aristas.map((arista) => (
            <span
              key={`etiqueta-${arista.id}`}
              title={arista.titulo}
              className="pointer-events-none absolute max-w-[180px] -translate-x-1/2 -translate-y-1/2 truncate rounded-[var(--radius-full)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-[var(--space-2)] py-[1px] text-[length:var(--font-size-xs)] font-semibold whitespace-nowrap text-[var(--brand-800)]"
              style={{ left: arista.lx, top: arista.ly }}
            >
              {arista.etiqueta}
            </span>
          ))}

          {layout.cajas.map(({ nodo, x, y, huerfano }) => (
            <button
              key={nodo.id}
              type="button"
              onClick={() => onSelectNodo?.(nodo)}
              aria-label={`Ir al nodo ${nodo.etiqueta}`}
              className={`absolute flex flex-col items-start justify-center gap-[2px] overflow-hidden border-[1.5px] px-[var(--space-3)] py-[var(--space-2)] text-left shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-150 hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)] focus-visible:outline focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)] motion-reduce:transition-none ${FORMA_HOJA} ${estiloHoja(nodo, huerfano)}`}
              style={{ left: x, top: y, width: CAJA_ANCHO, height: CAJA_ALTO }}
            >
              <span className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)]">
                <RotuloHoja nodo={nodo} huerfano={huerfano} />
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
