import { TIPO_NODO } from '../../types/index.js';
import { isNodoPresentable } from '../../utils/isNodoPresentable.js';
import { ChatMessageBubble } from '../ChatMessageBubble/index.js';
import { ChatSummaryCard } from '../ChatSummaryCard/index.js';

// RF-26: solo presenta el contenido. `entrada`, `multimedia` y `ejercicio`
// son de otras tareas. El aviso de nodo no presentable es de FE-M03-08.
export function ChatNodeMessage({ nodo }) {
  if (!isNodoPresentable(nodo)) return null;

  const { emisor, texto, instrucciones, titulo } = nodo.contenido;

  if (nodo.tipo_nodo === TIPO_NODO.RESUMEN) {
    return <ChatSummaryCard titulo={titulo} texto={texto} />;
  }

  return (
    <ChatMessageBubble
      emisor={emisor}
      texto={texto}
      instrucciones={instrucciones}
    />
  );
}
