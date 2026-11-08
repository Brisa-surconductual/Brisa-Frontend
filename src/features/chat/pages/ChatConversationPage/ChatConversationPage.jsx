import { ArrowLeft, LoaderCircle, MessageCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { ApiErrorMessage } from '@/shared/components/ui/ApiErrorMessage/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';
import {
  LoadingRegion,
  Skeleton,
} from '@/shared/components/ui/Skeleton/index.js';

import { ChatThread } from '../../components/ChatThread/index.js';
import { NodeInputForm } from '../../components/NodeInputForm/index.js';

import { StaleNodeNotice } from './components/StaleNodeNotice/index.js';
import { useChatConversationPage } from './hooks/useChatConversationPage.js';
import { ESTADO_CONVERSACION } from './utils/conversationState.js';
import { ACCION_ERROR_ENVIO } from './utils/envio.js';

const { CARGANDO, LISTO, ERROR, ENVIANDO, AVANZANDO, ERROR_ENVIO } =
  ESTADO_CONVERSACION;

// Esqueleto con la forma de las burbujas de Brisa.
function ConversationSkeleton({ anchos = ['70%', '55%'] }) {
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      {anchos.map((ancho) => (
        <div key={ancho} className="flex items-end gap-[var(--space-2)]">
          <Skeleton shape="circle" width={24} />
          <Skeleton shape="block" width={ancho} height={52} />
        </div>
      ))}
    </div>
  );
}

function BackButton({ onClick, children }) {
  return (
    <Button variant="secondary" size="large" onClick={onClick}>
      <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
      {children}
    </Button>
  );
}

function ChatConversation() {
  const {
    estado,
    items,
    error,
    errorEnvio,
    accionErrorEnvio,
    aviso,
    nodoFormulario,
    claveFormulario,
    hayHilo,
    tituloRef,
    errorRef,
    ultimoRef,
    sesionNoEncontrada,
    retry,
    onRecursoError,
    responder,
    reintentarEnvio,
    goHome,
    goChat,
  } = useChatConversationPage();

  // D13: mientras redirige no se pinta nada.
  if (estado === ESTADO_CONVERSACION.DIRECCION_INVALIDA) return null;

  const errorEnLinea = accionErrorEnvio === ACCION_ERROR_ENVIO.INLINE;

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
          className="m-0 flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-balance text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
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
        loading={estado === CARGANDO}
        label="Cargando la conversación"
        skeleton={<ConversationSkeleton />}
      >
        {hayHilo && (
          <ChatThread
            items={items}
            onRecursoError={onRecursoError}
            ultimoRef={ultimoRef}
          />
        )}

        {/* RF-29: esqueleto mientras llega el nodo destino. */}
        <LoadingRegion
          loading={estado === AVANZANDO}
          label="Cargando el siguiente mensaje"
          skeleton={<ConversationSkeleton anchos={['60%']} />}
        />

        {aviso && <StaleNodeNotice mensaje={aviso.mensaje} />}

        {nodoFormulario && (
          <NodeInputForm
            key={claveFormulario}
            nodo={nodoFormulario}
            onResponder={responder}
            enviando={estado !== LISTO}
            errorExterno={errorEnLinea ? errorEnvio : null}
          />
        )}

        {estado === ENVIANDO && (
          <p
            role="status"
            className="m-0 flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
          >
            <LoaderCircle
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
            />
            Enviando tu respuesta
          </p>
        )}

        {/* Tabla 2.5: errores del envío que no van junto al componente. */}
        {estado === ERROR_ENVIO && (
          <div
            ref={errorRef}
            tabIndex={-1}
            className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
          >
            <ApiErrorMessage
              error={errorEnvio}
              onRetry={
                accionErrorEnvio === ACCION_ERROR_ENVIO.REINTENTAR
                  ? reintentarEnvio
                  : undefined
              }
            />

            {accionErrorEnvio === ACCION_ERROR_ENVIO.VOLVER_AL_CHAT ? (
              <BackButton onClick={goChat}>Volver al chat</BackButton>
            ) : (
              <BackButton onClick={goHome}>Volver al inicio</BackButton>
            )}
          </div>
        )}

        {estado === ERROR && (
          <div
            ref={errorRef}
            tabIndex={-1}
            className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
          >
            <ApiErrorMessage error={error} onRetry={retry} />

            {sesionNoEncontrada ? (
              <BackButton onClick={goChat}>Volver al chat</BackButton>
            ) : (
              <BackButton onClick={goHome}>Volver al inicio</BackButton>
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
