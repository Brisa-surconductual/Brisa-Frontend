import {
  Flag,
  FlagTriangleRight,
  HelpCircle,
  Link2,
  MessageSquare,
  Pencil,
  UserRound,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import { salidasOrdenadasDeNodo } from '../../../../services/flujosAdmin.js';
import {
  nombreContenidoCronograma,
  resumenCapturaPerfil,
  resumenEntradaNodo,
} from '../../../../services/nodosAdmin.js';

const CHIP =
  'inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)]';

/*
 * Nodos del flujo, con el inicial al principio. Solo lectura: el texto
 * se muestra tal cual lo definió el equipo de psicología. Cuando un nodo
 * tiene contenido asociado (RF-25), se muestra su nombre y su unidad
 * temporal a partir del catálogo `contenidos_cronograma`. Cuando el nodo
 * espera una respuesta (PR4), se muestra de qué tipo; sin ese dato, el
 * nodo es informativo (el estudiante solo confirma "Continuar").
 * RF-25: cada tarjeta lista sus salidas en el orden en que el motor las
 * evalúa ("cualquier otra respuesta" siempre al final).
 */
export function TreeNodeList({
  nodos,
  transiciones = [],
  canEdit = false,
  onEdit,
  contenidosCronograma = [],
}) {
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
          {nodos.map((nodo) => {
            const contenidoAsociado = nombreContenidoCronograma(
              contenidosCronograma,
              nodo.idContenidoCronograma,
            );
            const respuesta = resumenEntradaNodo(nodo.entrada);
            const captura = resumenCapturaPerfil(nodo.contenido);
            const salidas = salidasOrdenadasDeNodo(nodo, nodos, transiciones);

            return (
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

                  {nodo.esNodoFinal && (
                    <span
                      className={`${CHIP} border-[var(--success-border)] bg-[var(--success-bg)] font-bold text-[var(--success-text)]`}
                    >
                      <FlagTriangleRight
                        size={13}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      Nodo final
                    </span>
                  )}

                  {captura && (
                    <span
                      className={`${CHIP} border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)]`}
                    >
                      <UserRound
                        size={13}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      Captura: {captura}
                    </span>
                  )}

                  {nodo.orden !== null && (
                    <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
                      Orden {nodo.orden}
                    </span>
                  )}

                  {contenidoAsociado && (
                    <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
                      <Link2 size={13} strokeWidth={1.8} aria-hidden="true" />
                      {contenidoAsociado}
                    </span>
                  )}

                  {respuesta && (
                    <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
                      <HelpCircle
                        size={13}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      Respuesta: {respuesta}
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

                {!nodo.esNodoFinal && (
                  <div className="flex flex-col gap-[var(--space-1)] border-t border-[var(--surface-border)] pt-[var(--space-2)]">
                    <p className="m-0 text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)]">
                      Orden de evaluación de transiciones
                    </p>
                    {salidas.length === 0 ? (
                      <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--warning-text)]">
                        Sin transiciones de salida.
                      </p>
                    ) : (
                      <ol className="m-0 flex list-none flex-col gap-[2px] p-0 text-[length:var(--font-size-xs)] text-[var(--text-primary)]">
                        {salidas.map((salida) => (
                          <li
                            key={salida.id}
                            className="[overflow-wrap:anywhere]"
                          >
                            <span className="font-bold tabular-nums">
                              {salida.esPorDefecto
                                ? 'Por defecto'
                                : salida.esImplicita
                                  ? 'Automática'
                                  : `${salida.orden}.`}
                            </span>{' '}
                            {salida.esImplicita ? '' : `${salida.regla} `}→{' '}
                            {salida.destino}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
