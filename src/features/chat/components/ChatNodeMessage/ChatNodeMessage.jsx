import { TIPO_BLOQUE } from '../../types/index.js';
import { ChatMediaBlock } from '../ChatMediaBlock/index.js';
import { ChatMessageBubble } from '../ChatMessageBubble/index.js';

// Sangría igual al avatar más la separación, para alinear con la burbuja.
const SANGRIA = 'pl-[calc(var(--space-6)+var(--space-2))]';

// RF-26: pinta `nodo.bloques` en el orden recibido (ya viene ordenado).
// El texto se pinta tal cual, como texto plano (D5). La respuesta es de
// FE-M03-04 (D6). Los demás tipos los resuelve ChatMediaBlock.
export function ChatNodeMessage({ nodo, onRecursoError }) {
  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      {nodo.bloques.map((bloque, indice) => {
        // Los bloques de un nodo no cambian de lugar: el índice es estable.
        const key = indice;

        if (bloque.tipo === TIPO_BLOQUE.TEXTO) {
          return <ChatMessageBubble key={key} texto={bloque.texto} />;
        }

        if (bloque.tipo === TIPO_BLOQUE.INSTRUCCION) {
          return (
            <p
              key={key}
              className={`m-0 whitespace-pre-line text-[length:var(--font-size-xs)] leading-[1.55] text-[var(--text-secondary)] ${SANGRIA}`}
            >
              {bloque.texto}
            </p>
          );
        }

        return (
          <ChatMediaBlock
            key={key}
            bloque={bloque}
            onError={() => onRecursoError?.(indice)}
            className={`max-w-[85%] ${SANGRIA}`}
          />
        );
      })}
    </div>
  );
}
