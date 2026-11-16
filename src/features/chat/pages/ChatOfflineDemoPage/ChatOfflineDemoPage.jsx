import {
  AlertTriangle,
  ArrowLeft,
  FlaskConical,
  Info,
  Plus,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ChatAdminNotice } from '../../components/ChatAdminNotice/index.js';

import { useChatOfflineDemoPage } from './hooks/useChatOfflineDemoPage.js';

const ESTADO_LEGIBLE = Object.freeze({
  EN_CURSO: 'En curso',
  INTERRUMPIDA: 'Interrumpida',
  COMPLETADA: 'Completada',
});

const pendientesTexto = (n) =>
  n === 1 ? '1 respuesta pendiente' : `${n} respuestas pendientes`;

/*
 * Solo desarrollo: punto de entrada para probar el chat sin conexión sin
 * backend ni precarga real. Fuera del modo de demostración solo informa
 * que no está disponible.
 */
export function ChatOfflineDemoPage() {
  const { habilitada, sesiones, error, creando, crearSesion, abrir, goChat } =
    useChatOfflineDemoPage();

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-4)] py-[var(--space-4)]">
      <header className="flex flex-col gap-[var(--space-2)]">
        <Button
          variant="ghost"
          size="large"
          onClick={goChat}
          className="min-h-[44px] w-fit px-[var(--space-3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
          Volver
        </Button>
        <h1 className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
          Demostración del chat sin conexión
        </h1>
      </header>

      {!habilitada ? (
        <ChatAdminNotice tone="info" icon={Info} role="status">
          La demostración sin conexión solo está disponible en modo de
          desarrollo.
        </ChatAdminNotice>
      ) : (
        <>
          <ChatAdminNotice
            tone="warning"
            icon={FlaskConical}
            title="Datos de demostración"
            role="note"
          >
            Crea una conversación ficticia guardada en este navegador, como si
            ya se hubiera descargado. Usa tu cuenta actual solo para aislar los
            datos; nada se envía al servidor.
          </ChatAdminNotice>

          {error && (
            <ChatAdminNotice tone="danger" icon={AlertTriangle} role="alert">
              No fue posible usar el almacenamiento del dispositivo.
            </ChatAdminNotice>
          )}

          <Button onClick={crearSesion} disabled={creando}>
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            {creando ? 'Creando sesión...' : 'Crear sesión de demostración'}
          </Button>

          <section
            aria-labelledby="sesiones-guardadas"
            className="flex flex-col gap-[var(--space-2)]"
          >
            <h2
              id="sesiones-guardadas"
              className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]"
            >
              Sesiones guardadas en este dispositivo
            </h2>

            {sesiones?.length === 0 && (
              <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                Aún no hay sesiones guardadas para tu cuenta.
              </p>
            )}

            {sesiones?.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
                {sesiones.map((sesion) => (
                  <li
                    key={sesion.idSesion}
                    className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)]"
                  >
                    <p className="m-0 font-mono text-[length:var(--font-size-xs)] break-all text-[var(--text-secondary)]">
                      {sesion.idSesion}
                    </p>
                    <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-primary)]">
                      {ESTADO_LEGIBLE[sesion.estado] ?? sesion.estado} ·
                      secuencia {sesion.ultimaSecuencia ?? 'desconocida'} ·{' '}
                      {pendientesTexto(sesion.pendientes)}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => abrir(sesion.idSesion)}
                    >
                      Abrir conversación
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
