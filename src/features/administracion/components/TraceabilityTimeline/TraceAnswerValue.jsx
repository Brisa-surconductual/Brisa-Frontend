import { ANSWER_KIND, answerLabels, describeTraceAnswer } from '../../services/traceAnswer.js';

/*
 * Valor registrado de una interacción (RF-27: sin modificar). Todo se
 * pinta como texto con React (nunca como HTML). La etiqueta de la opción
 * acompaña al valor; no lo reemplaza.
 */
const VALUE_BOX =
  'm-0 rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-primary)] [overflow-wrap:anywhere]';

const MONO = 'font-[family-name:var(--font-mono)]';

function RawValue({ children }) {
  return <code className={`${MONO} text-[length:var(--font-size-xs)] text-[var(--text-secondary)]`}>{children}</code>;
}

function Value({ answer }) {
  switch (answer.kind) {
    case ANSWER_KIND.CONTINUE:
      return (
        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          El participante avanzó al siguiente paso. Este paso no solicita respuesta.{' '}
          <RawValue>valor: null</RawValue>
        </p>
      );
    case ANSWER_KIND.NULL:
      return (
        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          Sin valor registrado. <RawValue>valor: null</RawValue>
        </p>
      );
    case ANSWER_KIND.EMPTY_TEXT:
      return (
        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          Texto vacío. <RawValue>valor: &quot;&quot;</RawValue>
        </p>
      );
    case ANSWER_KIND.TEXT:
      return <p className={`${VALUE_BOX} whitespace-pre-wrap`}>{answer.text}</p>;
    case ANSWER_KIND.NUMBER:
      return <p className={`${VALUE_BOX} ${MONO} tabular-nums`}>{answer.text}</p>;
    case ANSWER_KIND.BOOLEAN:
      return (
        <p className={VALUE_BOX}>
          {answer.text === 'true' ? 'Sí' : 'No'} <RawValue>({answer.text})</RawValue>
        </p>
      );
    case ANSWER_KIND.LIST:
      return answer.items.length === 0 ? (
        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          Lista vacía. <RawValue>valor: []</RawValue>
        </p>
      ) : (
        <ul className={`${VALUE_BOX} flex list-disc flex-col gap-[var(--space-1)] pl-[var(--space-6)]`}>
          {answer.items.map((item, index) => (
            <li key={index} className="whitespace-pre-wrap">{item}</li>
          ))}
        </ul>
      );
    default:
      return <pre className={`${VALUE_BOX} ${MONO} overflow-x-auto whitespace-pre-wrap text-[length:var(--font-size-xs)]`}>{answer.text}</pre>;
  }
}

export function TraceAnswerValue({ record }) {
  const answer = describeTraceAnswer(record);
  const labels = answerLabels(record.answerLabel);

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <Value answer={answer} />

      {labels.length === 1 && (
        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          Opción elegida: <span className="font-bold text-[var(--text-primary)]">{labels[0]}</span>
        </p>
      )}

      {labels.length > 1 && (
        <div className="text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          <p className="m-0">Opciones elegidas:</p>
          <ul className="m-0 mt-[var(--space-1)] flex list-disc flex-col gap-[var(--space-1)] pl-[var(--space-6)] font-bold text-[var(--text-primary)]">
            {labels.map((label, index) => (
              <li key={index}>{label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
