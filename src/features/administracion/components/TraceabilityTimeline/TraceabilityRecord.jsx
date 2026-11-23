import { ArrowDown, Flag, ShieldCheck, ShieldQuestion } from 'lucide-react';

import {
  INPUT_TYPE_LABEL,
  NODE_TYPE_LABEL,
  UNVERIFIABLE_REASON_LABEL,
} from '../../types/chatTraceability.js';
import { TraceTimestamp } from '../TraceTimestamp/index.js';

import { TraceAnswerValue } from './TraceAnswerValue.jsx';

/*
 * Un registro de la trazabilidad (RF-38). El texto del nodo solo se
 * muestra si el backend lo marcó VERIFICADO, exactamente como llegó; si
 * no es verificable se advierte y no se muestra ningún texto. El fin del
 * flujo (`id_nodo_destino: null`) no es un error.
 */
const SECTION_LABEL =
  'm-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase';

function ContentStatus({ record }) {
  if (record.verified) {
    return (
      <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--success-border)] bg-[var(--success-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--success-text)]">
        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
        Contenido verificado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--warning-text)]">
      <ShieldQuestion size={14} strokeWidth={2} aria-hidden="true" />
      Contenido no verificable
    </span>
  );
}

function NodeContent({ record }) {
  if (!record.verified) {
    const reason = record.reason ? UNVERIFIABLE_REASON_LABEL[record.reason] : null;

    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--warning-text)]">
        <p className="m-0">
          No se puede confirmar qué contenido vio el participante en este paso, por eso no se muestra.
        </p>
        {record.reason && (
          <p className="m-0 mt-[var(--space-1)]">
            Motivo: {reason ?? 'no descrito por la interfaz'}{' '}
            <code className="font-[family-name:var(--font-mono)] text-[length:var(--font-size-xs)]">
              ({record.reason})
            </code>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      {record.nodeType && (
        <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
          {NODE_TYPE_LABEL[record.nodeType] ?? record.nodeType}
        </p>
      )}
      {record.nodeText === null ? (
        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-muted)]">
          Este contenido no tiene texto (por ejemplo, solo recursos multimedia).
        </p>
      ) : (
        <blockquote className="m-0 border-l-[3px] border-[var(--brand-500)] pl-[var(--space-3)] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] whitespace-pre-line text-[var(--text-primary)] [overflow-wrap:anywhere]">
          {record.nodeText}
        </blockquote>
      )}
    </div>
  );
}

export function TraceabilityRecord({ record, isLast }) {
  const isEnd = record.nextNodeId === null;

  return (
    <li className="relative flex gap-[var(--space-3)] md:gap-[var(--space-4)]">
      <div className="flex shrink-0 flex-col items-center" aria-hidden="true">
        <span className="flex h-[32px] min-w-[32px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--brand-600)] px-[var(--space-1)] text-[length:var(--font-size-xs)] font-extrabold text-[var(--button-primary-text)] tabular-nums">
          {record.sequence}
        </span>
        {!isLast && <span className="w-[2px] flex-1 bg-[var(--surface-border)]" />}
      </div>

      <article className="mb-[var(--space-5)] flex min-w-0 flex-1 flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
        <header className="flex flex-col gap-[var(--space-2)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h3 className="m-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]">
            Interacción {record.sequence}
          </h3>
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-muted)]">
            <TraceTimestamp value={record.at} />
          </p>
        </header>

        <section className="flex flex-col gap-[var(--space-2)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
            <h4 className={SECTION_LABEL}>Contenido presentado</h4>
            <ContentStatus record={record} />
          </div>
          <NodeContent record={record} />
        </section>

        <section className="flex flex-col gap-[var(--space-2)]">
          <h4 className={SECTION_LABEL}>
            Respuesta registrada · {INPUT_TYPE_LABEL[record.inputType] ?? record.inputType}
          </h4>
          <TraceAnswerValue record={record} />
        </section>

        <p className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
          {isEnd ? (
            <>
              <Flag size={16} strokeWidth={1.8} aria-hidden="true" />
              Fin del flujo conversacional
            </>
          ) : (
            <>
              <ArrowDown size={16} strokeWidth={1.8} aria-hidden="true" />
              Continúa al siguiente contenido
            </>
          )}
        </p>

        <details className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
          <summary className="w-fit cursor-pointer rounded-[var(--radius-sm)] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)]">
            Datos técnicos
          </summary>
          <dl className="m-0 mt-[var(--space-2)] grid grid-cols-1 gap-[var(--space-1)] [overflow-wrap:anywhere] sm:grid-cols-[auto_1fr] sm:gap-x-[var(--space-3)]">
            <dt>Nodo</dt>
            <dd className="m-0 font-[family-name:var(--font-mono)]">{record.nodeId}</dd>
            <dt>Nodo destino</dt>
            <dd className="m-0 font-[family-name:var(--font-mono)]">{record.nextNodeId ?? 'null (fin del flujo)'}</dd>
            <dt>Tipo de entrada</dt>
            <dd className="m-0 font-[family-name:var(--font-mono)]">{record.inputType}</dd>
          </dl>
        </details>
      </article>
    </li>
  );
}
