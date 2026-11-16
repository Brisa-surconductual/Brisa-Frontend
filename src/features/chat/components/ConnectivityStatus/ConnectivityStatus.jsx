import { CloudOff, HardDrive, Wifi } from 'lucide-react';

import {
  CONECTIVIDAD_INTERACCION,
  MENSAJE_SINCRONIZACION,
} from '../../types/index.js';
import { SyncStatus } from '../SyncStatus/index.js';

const plural = (n) =>
  n === 1 ? '1 respuesta guardada' : `${n} respuestas guardadas`;

/*
 * Indicador de conectividad del chat sin conexión (RF-34). El estado se
 * dice con texto e ícono, no solo con color.
 *
 * `sincronizacion` ({ sesion, simulada }) solo llega cuando hay un
 * motor de sincronización (hoy, el simulador de la demostración). Sin él
 * no se promete enviar nada: al volver la conexión solo se informa
 * cuántas respuestas siguen en el dispositivo.
 */
export function ConnectivityStatus({
  conectividad,
  pendientes,
  restablecida,
  sincronizacion = null,
}) {
  const sinConexion = conectividad === CONECTIVIDAD_INTERACCION.SIN_CONEXION;
  const Icono = sinConexion ? CloudOff : Wifi;

  let texto;
  if (sinConexion) {
    texto = 'Sin conexión. Tus respuestas se guardan en este dispositivo.';
  } else if (restablecida) {
    texto = sincronizacion
      ? MENSAJE_SINCRONIZACION.CONEXION_RESTABLECIDA
      : 'La conexión se ha restablecido.';
  } else {
    texto = 'Con conexión.';
  }

  return (
    <div
      role="status"
      className={`flex flex-col gap-[var(--space-1)] rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] ${
        sinConexion
          ? 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]'
          : 'border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-text)]'
      }`}
    >
      <p className="m-0 flex items-start gap-[var(--space-2)] font-semibold">
        <Icono
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
          className="mt-px shrink-0"
        />
        <span>{texto}</span>
      </p>

      {pendientes > 0 && (
        <p className="m-0 flex items-start gap-[var(--space-2)]">
          <HardDrive
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
            className="mt-px shrink-0"
          />
          <span>
            {plural(pendientes)} en el dispositivo, pendientes de sincronizar.
            {!sincronizacion &&
              ' La sincronización automática todavía no está disponible.'}
          </span>
        </p>
      )}

      {sincronizacion && (
        <SyncStatus
          sesion={sincronizacion.sesion}
          simulada={sincronizacion.simulada}
        />
      )}
    </div>
  );
}
