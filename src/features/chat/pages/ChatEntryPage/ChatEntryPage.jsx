import { AlertTriangle, ArrowLeft, LogIn, RefreshCw } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ESTADO_PANTALLA_ENTRADA } from '../../types/estadoPantallaEntrada.js';

import { BrisaMark } from './components/BrisaMark/index.js';
import { EntryStatePanel } from './components/EntryStatePanel/index.js';
import { useChatEntryPage } from './hooks/useChatEntryPage.js';
import { formatLastInteraction } from './utils/formatLastInteraction.js';

const TITLE_ID = 'chat-entrada-titulo';

function SessionDetails({ sesion }) {
  const unidad = sesion.ubicacionTemporal;
  const ultimaActividad = formatLastInteraction(
    sesion.sesion.fechaUltimaInteraccion,
  );

  return (
    <dl className="m-0 mt-[var(--space-4)] flex flex-col gap-[var(--space-2)] text-[length:var(--font-size-sm)]">
      {unidad?.nombreUnidad && (
        <div className="flex justify-center gap-[var(--space-2)]">
          <dt className="font-semibold text-[var(--text-muted)]">Unidad</dt>
          <dd className="m-0 font-bold text-[var(--text-primary)]">
            {unidad.nombreUnidad}
          </dd>
        </div>
      )}

      {ultimaActividad && (
        <div className="flex justify-center gap-[var(--space-2)]">
          <dt className="font-semibold text-[var(--text-muted)]">
            Última actividad
          </dt>
          <dd className="m-0 font-bold text-[var(--text-primary)]">
            {ultimaActividad}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function ChatEntryPage() {
  const { estado, sesion, error, retry, goHome, goLogin } = useChatEntryPage();

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[480px] flex-col justify-center py-[var(--space-6)]">
      {estado === ESTADO_PANTALLA_ENTRADA.CARGANDO && (
        <EntryStatePanel
          titleId={TITLE_ID}
          title="Preparando tu sesión"
          busy
          visual={<BrisaMark pulse />}
        >
          <p className="m-0">
            Estamos buscando dónde quedaste. Solo tardará un momento.
          </p>
        </EntryStatePanel>
      )}

      {estado === ESTADO_PANTALLA_ENTRADA.REANUDANDO && (
        <EntryStatePanel
          titleId={TITLE_ID}
          title="Retomamos donde quedaste"
          visual={<BrisaMark />}
        >
          <p className="m-0">
            Tu conversación sigue en el punto donde la dejaste.
          </p>
          <SessionDetails sesion={sesion} />
        </EntryStatePanel>
      )}

      {estado === ESTADO_PANTALLA_ENTRADA.LISTA && (
        <EntryStatePanel
          titleId={TITLE_ID}
          title="Tu sesión está lista"
          visual={<BrisaMark />}
        >
          <p className="m-0">
            Empezamos desde el principio de tu intervención.
          </p>
          <SessionDetails sesion={sesion} />
        </EntryStatePanel>
      )}

      {estado === ESTADO_PANTALLA_ENTRADA.ERROR && (
        <EntryStatePanel
          tone="danger"
          role="alert"
          titleId={TITLE_ID}
          title="No pudimos iniciar tu chat"
          visual={
            <AlertTriangle
              size={40}
              strokeWidth={1.6}
              className="text-[var(--danger)]"
              aria-hidden="true"
            />
          }
          actions={
            <>
              {error.reintentable && (
                <Button onClick={retry} size="large">
                  <RefreshCw size={20} strokeWidth={1.8} aria-hidden="true" />
                  Reintentar
                </Button>
              )}

              {error.requiereLogin && (
                <Button onClick={goLogin} size="large">
                  <LogIn size={20} strokeWidth={1.8} aria-hidden="true" />
                  Iniciar sesión
                </Button>
              )}

              <Button onClick={goHome} variant="secondary" size="large">
                <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
                Volver al inicio
              </Button>
            </>
          }
        >
          <p className="m-0">{error.mensaje}</p>
        </EntryStatePanel>
      )}
    </div>
  );
}
