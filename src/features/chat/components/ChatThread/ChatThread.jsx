import { ChatNodeMessage } from '../ChatNodeMessage/index.js';
import { UserAnswerBubble } from '../UserAnswerBubble/index.js';

// Pinta los items en el orden recibido: no ordena, no filtra, no deduplica.
// Item: { tipo: 'nodo', id, nodo } o { tipo: 'respuesta', id, texto }.
export function ChatThread({ items }) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversación"
      className="flex flex-col gap-[var(--space-3)]"
    >
      {items.map((item) =>
        item.tipo === 'respuesta' ? (
          <UserAnswerBubble key={item.id} texto={item.texto} />
        ) : (
          <ChatNodeMessage key={item.id} nodo={item.nodo} />
        ),
      )}
    </div>
  );
}
