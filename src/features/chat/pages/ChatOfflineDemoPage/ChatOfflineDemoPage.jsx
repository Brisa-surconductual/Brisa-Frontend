import {
  AlertTriangle,
  ArrowLeft,
  FlaskConical,
  Info,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';

import { ChatAdminNotice } from '../../components/ChatAdminNotice/index.js';
import { ConnectivityStatus } from '../../components/ConnectivityStatus/index.js';
import { SyncStatus } from '../../components/SyncStatus/index.js';

import { useChatOfflineDemoPage } from './hooks/useChatOfflineDemoPage.js';

const ESTADO_LEGIBLE = Object.freeze({
  EN_CURSO: 'En curso',
  INTERRUMPIDA: 'Interrumpida',
  COMPLETADA: 'Completada',
});

const pendientesTexto = (n) =>
  n === 1 ? '1 respuesta pendiente' : `${n} respuestas pendientes`;

const conErrorTexto = (n) =>
  n === 1
    ? '1 con error de sincronización'
    : `${n} con error de sincronización`;

// Controles del simulador de la sincronización (tarea 4).
function SyncSimulationPanel({
  conectividad,
  pendientes,
  simulada,
  alternarSimulacion,
  sincronizacion,
}) {
  const { estado, sincronizarAhora, simulador } = sincronizacion;

  return (
    <section
      aria-labelledby="sincronizacion-simulada"
      className="flex flex-col gap-[var(--space-3)]"
    >
      <h2
        id="sincronizacion-simulada"
        className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]"
      >
        Sincronización simulada
      </h2>

      <ChatAdminNotice tone="warning" icon={FlaskConical} role="note">
        Las confirmaciones las genera un simulador dentro de este navegador. No
        se envía información al servidor y nada de lo «sincronizado» existe en
        el backend.
      </ChatAdminNotice>

      <ConnectivityStatus
        conectividad={conectividad}
        pendientes={pendientes}
        restablecida={false}
        sincronizacion={{ sesion: undefined, simulada: false }}
      />

      <Button
        variant="secondary"
        onClick={alternarSimulacion}
        aria-pressed={simulada}
      >
        {simulada
          ? 'Dejar de simular la falta de conexión'
          : 'Simular falta de conexión'}
      </Button>

      {simulador && (
        <>
          <SelectField
            id="escenario-simulador"
            label="Respuesta del simulador en el próximo envío"
            placeholder="Elige una respuesta"
            options={simulador.opciones.map(({ valor, etiqueta }) => ({
              value: valor,
              label: etiqueta,
            }))}
            value={simulador.escenario}
            onChange={(evento) =>
              simulador.elegirEscenario(evento.target.value)
            }
            hint="Se aplica a un solo envío y después vuelve a «Éxito»."
          />

          <Button onClick={sincronizarAhora}>
            <RefreshCw size={18} strokeWidth={2} aria-hidden="true" />
            Sincronizar ahora
          </Button>

          <p
            role="status"
            className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
          >
            {estado?.sincronizando ? 'Sincronizando… · ' : ''}
            Envíos al simulador: {simulador.estadisticas.solicitudes} · en
            curso: {simulador.estadisticas.enCurso} · simultáneos como máximo:{' '}
            {simulador.estadisticas.simultaneasMaximas}
          </p>
        </>
      )}
    </section>
  );
}

/*
 * Solo desarrollo: punto de entrada para probar el chat sin conexión sin
 * backend ni precarga real. Fuera del modo de demostración solo informa
 * que no está disponible.
 */
export function ChatOfflineDemoPage() {
  const {
    habilitada,
    sesiones,
    error,
    creando,
    crearSesion,
    conectividad,
    simulada,
    alternarSimulacion,
    sincronizacion,
    abrir,
    goChat,
  } = useChatOfflineDemoPage();
  const totalPendientes =
    sesiones?.reduce((total, sesion) => total + sesion.pendientes, 0) ?? 0;

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

          {sincronizacion.activa && (
            <SyncSimulationPanel
              conectividad={conectividad}
              pendientes={totalPendientes}
              simulada={simulada}
              alternarSimulacion={alternarSimulacion}
              sincronizacion={sincronizacion}
            />
          )}

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
                      {sesion.conError > 0 &&
                        ` · ${conErrorTexto(sesion.conError)}`}
                    </p>
                    {sincronizacion.activa && (
                      <div className="flex flex-col gap-[var(--space-1)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                        <SyncStatus
                          sesion={
                            sincronizacion.estado?.sesiones[sesion.idSesion]
                          }
                          simulada={false}
                        />
                      </div>
                    )}
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
