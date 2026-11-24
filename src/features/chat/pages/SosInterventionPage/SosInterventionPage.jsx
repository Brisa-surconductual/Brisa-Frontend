import { ArrowLeft, Info, LifeBuoy, LoaderCircle } from 'lucide-react';

import { ApiErrorMessage } from '@/shared/components/ui/ApiErrorMessage/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';

import { ChatNodeMessage } from '../../components/ChatNodeMessage/index.js';
import { NodeInputForm } from '../../components/NodeInputForm/index.js';
import {
  ACCION_ERROR_ENVIO_SOS,
  CODIGO_ERROR_SOS,
  FASE_SOS,
} from '../../types/sos.js';
import { GLASS } from '../../utils/glass.js';

import { SosOutcome } from './components/SosOutcome/index.js';
import { SosTimer } from './components/SosTimer/index.js';
import { SupportResources } from './components/SupportResources/index.js';
import {
  ESTADO_RETORNO,
  useSosInterventionPage,
} from './hooks/useSosInterventionPage.js';

const {
  SIN_INTERVENCION,
  ACTIVANDO,
  ERROR_ACTIVACION,
  EN_CURSO,
  FINALIZANDO,
  ERROR_FINALIZACION,
  FINALIZADA,
} = FASE_SOS;

// Textos de interfaz (no son errores del backend).
const TEXTO_EN_CURSO_OTRA_PESTANA =
  'Este ejercicio se abrió en otra pestaña o antes de recargar la página y no se puede continuar aquí. Se cerrará solo al cumplirse su tiempo.';
const TEXTO_SIN_INTERVENCION =
  'No hay un ejercicio de calma abierto en esta pestaña.';
const TEXTO_RETORNO_OTRA_SESION =
  'No pudimos retomar la misma conversación que tenías en pausa.';
const TEXTO_RETORNO_OTRO_NODO =
  'Tu conversación se retomó, pero no en el mismo punto en que la dejaste.';

function Estado({ children, icono: Icono = Info, ocupado = false }) {
  return (
    <p
      role="status"
      aria-busy={ocupado || undefined}
      className={`m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-2xl)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)] ${GLASS.panelTexto}`}
    >
      <Icono
        size={20}
        strokeWidth={1.8}
        aria-hidden="true"
        className={`shrink-0 ${ocupado ? 'animate-spin motion-reduce:animate-none' : ''}`}
      />
      {children}
    </p>
  );
}

function ReturnActions({ retorno, reanudaChat, volver }) {
  const reanudando = retorno.estado === ESTADO_RETORNO.REANUDANDO;
  let texto = reanudaChat
    ? 'Volver a tu conversación'
    : 'Volver a lo que estabas haciendo';

  if (retorno.estado === ESTADO_RETORNO.NO_EXACTO)
    texto = 'Ir a la conversación';

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      {retorno.estado === ESTADO_RETORNO.NO_EXACTO && (
        <Estado>
          {retorno.mismaSesion
            ? TEXTO_RETORNO_OTRO_NODO
            : TEXTO_RETORNO_OTRA_SESION}
        </Estado>
      )}

      {retorno.estado === ESTADO_RETORNO.ERROR && (
        <ApiErrorMessage error={retorno.error} />
      )}

      <Button
        size="large"
        fullWidth
        onClick={volver}
        loading={reanudando}
        loadingText="Retomando tu conversación…"
      >
        <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
        {texto}
      </Button>
    </div>
  );
}

// RF-43: pantalla de la intervención SOS (página delgada: todo el estado
// vive en el controlador y en useSosInterventionPage).
export function SosInterventionPage() {
  const {
    fase,
    restanteMs,
    nodo,
    claveFormulario,
    enviando,
    cargandoNodo,
    errorNodo,
    errorEnvio,
    errorEnvioEnLinea,
    accionErrorEnvio,
    error,
    resultado,
    estadoDesconocido,
    recursos,
    retorno,
    reanudaChat,
    tituloRef,
    outcomeRef,
    errorRef,
    responder,
    reintentarEnvio,
    reintentarNodo,
    reintentarActivacion,
    cerrar,
    reintentarFinalizacion,
    volver,
    empezar,
    irAlInicio,
  } = useSosInterventionPage();

  const conNodo =
    [EN_CURSO, FINALIZANDO, ERROR_FINALIZACION].includes(fase) && nodo;
  const mostrarFormulario =
    fase === EN_CURSO &&
    nodo &&
    !errorNodo &&
    !cargandoNodo &&
    accionErrorEnvio !== ACCION_ERROR_ENVIO_SOS.BLOQUEADO;
  const errorEnvioBloque =
    errorEnvio && accionErrorEnvio !== ACCION_ERROR_ENVIO_SOS.INLINE
      ? errorEnvio
      : null;
  const terminada = fase === FINALIZADA || fase === ERROR_FINALIZACION;

  return (
    <div
      className={`mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-4)] rounded-[var(--radius-2xl)] px-[var(--space-3)] py-[var(--space-4)] ${GLASS.fondo}`}
    >
      <header
        className={`flex items-center gap-[var(--space-2)] rounded-[var(--radius-2xl)] px-[var(--space-3)] py-[var(--space-2)] ${GLASS.panel}`}
      >
        <h1
          ref={tituloRef}
          tabIndex={-1}
          className="m-0 flex min-w-0 flex-1 items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-balance text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
        >
          <LifeBuoy
            size={22}
            strokeWidth={1.8}
            aria-hidden="true"
            className="shrink-0 text-[var(--brand-600)]"
          />
          Ejercicio de calma
        </h1>

        {restanteMs !== null && fase !== ACTIVANDO && (
          <SosTimer restanteMs={restanteMs} />
        )}
      </header>

      {fase === ACTIVANDO && (
        <Estado icono={LoaderCircle} ocupado>
          Abriendo tu ejercicio de calma…
        </Estado>
      )}

      {fase === SIN_INTERVENCION && (
        <>
          <Estado>{TEXTO_SIN_INTERVENCION}</Estado>
          <Button size="large" fullWidth onClick={empezar}>
            <LifeBuoy size={20} strokeWidth={1.8} aria-hidden="true" />
            Empezar el ejercicio de calma
          </Button>
          <Button
            variant="secondary"
            size="large"
            fullWidth
            onClick={irAlInicio}
          >
            Ir al inicio
          </Button>
        </>
      )}

      {fase === ERROR_ACTIVACION && (
        <div
          ref={errorRef}
          tabIndex={-1}
          className="flex flex-col gap-[var(--space-3)] focus:outline-none"
        >
          <ApiErrorMessage error={error} onRetry={reintentarActivacion} />
          {error?.codigo === CODIGO_ERROR_SOS.INTERVENCION_EN_CURSO && (
            <Estado>{TEXTO_EN_CURSO_OTRA_PESTANA}</Estado>
          )}
          <ReturnActions
            retorno={retorno}
            reanudaChat={reanudaChat}
            volver={volver}
          />
        </div>
      )}

      {conNodo && (
        <section
          aria-label="Contenido del ejercicio"
          className="flex flex-col gap-[var(--space-3)]"
        >
          <ChatNodeMessage nodo={nodo} />
        </section>
      )}

      {fase === EN_CURSO && cargandoNodo && (
        <Estado icono={LoaderCircle} ocupado>
          Cargando el siguiente paso…
        </Estado>
      )}

      {fase === EN_CURSO && errorNodo && (
        <ApiErrorMessage error={errorNodo} onRetry={reintentarNodo} />
      )}

      {fase === EN_CURSO && errorEnvioBloque && (
        <ApiErrorMessage
          error={errorEnvioBloque}
          onRetry={
            accionErrorEnvio === ACCION_ERROR_ENVIO_SOS.REINTENTAR
              ? reintentarEnvio
              : undefined
          }
        />
      )}

      {mostrarFormulario && (
        <NodeInputForm
          key={claveFormulario}
          nodo={nodo}
          onResponder={responder}
          enviando={enviando}
          errorExterno={errorEnvioEnLinea}
        />
      )}

      {fase === EN_CURSO && (
        <Button variant="ghost" size="large" fullWidth onClick={cerrar}>
          Terminar el ejercicio
        </Button>
      )}

      {fase === FINALIZANDO && (
        <Estado icono={LoaderCircle} ocupado>
          Cerrando el ejercicio…
        </Estado>
      )}

      {fase === ERROR_FINALIZACION && (
        <div
          ref={errorRef}
          tabIndex={-1}
          className="flex flex-col gap-[var(--space-3)] focus:outline-none"
        >
          <ApiErrorMessage error={error} />
          <Button
            variant="secondary"
            size="large"
            fullWidth
            onClick={reintentarFinalizacion}
          >
            Intentar cerrar de nuevo
          </Button>
        </div>
      )}

      {fase === FINALIZADA && (
        <SosOutcome
          resultado={resultado}
          estadoDesconocido={estadoDesconocido}
          mensaje={error?.mensaje}
          outcomeRef={outcomeRef}
        />
      )}

      {terminada && (
        <>
          <SupportResources recursos={recursos} />
          <ReturnActions
            retorno={retorno}
            reanudaChat={reanudaChat}
            volver={volver}
          />
        </>
      )}
    </div>
  );
}
