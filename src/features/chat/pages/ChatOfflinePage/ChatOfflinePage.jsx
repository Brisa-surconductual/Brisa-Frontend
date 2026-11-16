import {
  AlertTriangle,
  ArrowLeft,
  CircleCheck,
  FlaskConical,
  HardDriveDownload,
  ImageOff,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Button } from '@/shared/components/ui/Button/index.js';
import {
  LoadingRegion,
  Skeleton,
} from '@/shared/components/ui/Skeleton/index.js';

import { ChatAdminNotice } from '../../components/ChatAdminNotice/index.js';
import { ChatThread } from '../../components/ChatThread/index.js';
import { ConnectivityStatus } from '../../components/ConnectivityStatus/index.js';
import { NodeInputForm } from '../../components/NodeInputForm/index.js';
import { MENSAJE_BLOQUEO, MENSAJE_RF34 } from '../../types/index.js';

import { useChatOfflinePage } from './hooks/useChatOfflinePage.js';
import { ESTADO_OFFLINE } from './utils/offlineState.js';

const { CARGANDO, LISTO, GUARDANDO, BLOQUEADO, ERROR_CARGA, COMPLETADA } =
  ESTADO_OFFLINE;

const ENVOLTORIO_FOCO =
  'rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]';

function ConversationSkeleton() {
  return (
    <div className="flex items-end gap-[var(--space-2)]">
      <Skeleton shape="circle" width={24} />
      <Skeleton shape="block" width="70%" height={52} />
    </div>
  );
}

function ChatOffline() {
  const {
    estado,
    items,
    hayHilo,
    nodoFormulario,
    claveFormulario,
    errorRespuesta,
    bloqueo,
    pendientes,
    retomada,
    recursosNoPresentados,
    otrosNoPresentables,
    conectividad,
    restablecida,
    demo,
    simulada,
    alternarSimulacion,
    sincronizacion,
    tituloRef,
    ultimoRef,
    bloqueoRef,
    responder,
    retry,
    goChat,
  } = useChatOfflinePage();

  const conContenido = estado !== CARGANDO && estado !== ERROR_CARGA;
  const multimediaAusente =
    (recursosNoPresentados > 0 || otrosNoPresentables > 0) &&
    estado !== BLOQUEADO;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-4)] py-[var(--space-4)]">
      <header className="flex items-center gap-[var(--space-2)]">
        <Button
          variant="ghost"
          size="large"
          onClick={goChat}
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

      {demo && (
        <div className="flex flex-col gap-[var(--space-2)]">
          <ChatAdminNotice
            tone="warning"
            icon={FlaskConical}
            title="Demostración sin conexión"
            role="note"
          >
            Modo de desarrollo: la conversación usa un paquete ficticio guardado
            en este navegador y nada se envía al servidor. Las confirmaciones de
            sincronización son simuladas.
          </ChatAdminNotice>
          <Button
            variant="secondary"
            onClick={alternarSimulacion}
            aria-pressed={simulada}
          >
            {simulada
              ? 'Dejar de simular la falta de conexión'
              : 'Simular falta de conexión'}
          </Button>
        </div>
      )}

      <ConnectivityStatus
        conectividad={conectividad}
        pendientes={pendientes}
        restablecida={restablecida}
        sincronizacion={sincronizacion}
      />

      {retomada && (
        <ChatAdminNotice tone="info" icon={HardDriveDownload} role="status">
          {MENSAJE_RF34.REAPERTURA}
        </ChatAdminNotice>
      )}

      <LoadingRegion
        loading={estado === CARGANDO}
        label="Cargando la conversación guardada"
        skeleton={<ConversationSkeleton />}
      >
        {conContenido && hayHilo && (
          <ChatThread items={items} ultimoRef={ultimoRef} />
        )}

        {multimediaAusente && (
          <ChatAdminNotice tone="neutral" icon={ImageOff} role="note">
            {MENSAJE_RF34.RECURSO_SIN_CACHE}
          </ChatAdminNotice>
        )}

        {nodoFormulario && (
          <NodeInputForm
            key={claveFormulario}
            nodo={nodoFormulario}
            onResponder={responder}
            enviando={estado !== LISTO}
            errorExterno={errorRespuesta}
          />
        )}

        {estado === GUARDANDO && (
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
            Guardando tu respuesta en el dispositivo
          </p>
        )}

        {estado === COMPLETADA && (
          <ChatAdminNotice tone="success" icon={CircleCheck} role="status">
            Conversación completada en este dispositivo.
          </ChatAdminNotice>
        )}

        {estado === BLOQUEADO && (
          <div ref={bloqueoRef} tabIndex={-1} className={ENVOLTORIO_FOCO}>
            <ChatAdminNotice tone="danger" icon={AlertTriangle} role="alert">
              {MENSAJE_BLOQUEO[bloqueo]}
            </ChatAdminNotice>
          </div>
        )}

        {estado === ERROR_CARGA && (
          <div className="flex flex-col gap-[var(--space-3)]">
            <ChatAdminNotice tone="danger" icon={AlertTriangle} role="alert">
              No fue posible leer la conversación guardada en el dispositivo.
            </ChatAdminNotice>
            <Button variant="secondary" onClick={retry}>
              <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
              Reintentar
            </Button>
          </div>
        )}
      </LoadingRegion>
    </div>
  );
}

// Con otro `idSesion` la conversación arranca de cero.
export function ChatOfflinePage() {
  const { idSesion } = useParams();

  return <ChatOffline key={idSesion} />;
}
