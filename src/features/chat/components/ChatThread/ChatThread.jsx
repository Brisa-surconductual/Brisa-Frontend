import { ChatNodeMessage } from '../ChatNodeMessage/index.js';
import { UserAnswerBubble } from '../UserAnswerBubble/index.js';

// Pinta los items en el orden recibido: no ordena, no filtra, no deduplica.
// Item: { tipo: 'nodo', id, nodo, actual? } o { tipo: 'respuesta', id, texto }.
// Solo el nodo actual reporta recursos caídos. El último item recibe
// `ultimoRef` para llevarle el foco; todos tienen el mismo envoltorio para
// que dejar de ser el último no vuelva a montar su contenido.
export function ChatThread({ items, onRecursoError, ultimoRef }) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversación"
      className="flex flex-col gap-[var(--space-3)]"
    >
      {items.map((item, i) => {
        const esUltimo = i === items.length - 1;

        return (
          <div
            key={item.id}
            ref={esUltimo ? ultimoRef : undefined}
            tabIndex={esUltimo ? -1 : undefined}
            className="rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
          >
            {item.tipo === 'respuesta' ? (
              <UserAnswerBubble texto={item.texto} />
            ) : (
              <ChatNodeMessage
                nodo={item.nodo}
                onRecursoError={item.actual ? onRecursoError : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
