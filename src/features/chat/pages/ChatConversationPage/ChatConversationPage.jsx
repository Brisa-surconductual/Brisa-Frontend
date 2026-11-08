import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { ApiErrorMessage } from '@/shared/components/ui/ApiErrorMessage/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';
import {
  LoadingRegion,
  Skeleton,
} from '@/shared/components/ui/Skeleton/index.js';

import { ChatThread } from '../../components/ChatThread/index.js';

import { useChatConversationPage } from './hooks/useChatConversationPage.js';
import { ESTADO_CONVERSACION } from './utils/conversationState.js';

// D4: esqueleto con la forma de dos burbujas de Brisa.
function ConversationSkeleton() {
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      {['70%', '55%'].map((ancho) => (
        <div key={ancho} className="flex items-end gap-[var(--space-2)]">
          <Skeleton shape="circle" width={24} />
          <Skeleton shape="block" width={ancho} height={52} />
        </div>
      ))}
    </div>
  );
}

function ChatConversation() {
  const {
    estado,
    items,
    error,
    tituloRef,
    sesionNoEncontrada,
    retry,
    onRecursoError,
    goHome,
    goChat,
  } = useChatConversationPage();

  // D13: mientras redirige no se pinta nada.
  if (estado === ESTADO_CONVERSACION.DIRECCION_INVALIDA) return null;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-4)] py-[var(--space-4)]">
      <header className="flex items-center gap-[var(--space-2)]">
        <Button
          variant="ghost"
          size="large"
          onClick={goHome}
          className="min-h-[44px] px-[var(--space-3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
          Volver
        </Button>

        <h1
          ref={tituloRef}
          tabIndex={-1}
          className="m-0 flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-balance text-[var(--text-primary)] outline-none"
        >
          <MessageCircle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
            className="text-[var(--brand-600)]"
          />
          Chat con Brisa
        </h1>
      </header>

      <LoadingRegion
        loading={estado === ESTADO_CONVERSACION.CARGANDO}
        label="Cargando la conversación"
        skeleton={<ConversationSkeleton />}
      >
        {estado === ESTADO_CONVERSACION.LISTO && (
          // D6 y D8: sin acciones de respuesta en esta parte.
          <ChatThread items={items} onRecursoError={onRecursoError} />
        )}

        {estado === ESTADO_CONVERSACION.ERROR && (
          <div className="flex flex-col gap-[var(--space-3)]">
            <ApiErrorMessage error={error} onRetry={retry} />

            {sesionNoEncontrada ? (
              <Button variant="secondary" size="large" onClick={goChat}>
                <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
                Volver al chat
              </Button>
            ) : (
              <Button variant="secondary" size="large" onClick={goHome}>
                <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
                Volver al inicio
              </Button>
            )}
          </div>
        )}
      </LoadingRegion>
    </div>
  );
}

// Con otro `idSesion` la conversación arranca de cero (estado, D7 y D13).
export function ChatConversationPage() {
  const { idSesion } = useParams();

  return <ChatConversation key={idSesion} />;
}
