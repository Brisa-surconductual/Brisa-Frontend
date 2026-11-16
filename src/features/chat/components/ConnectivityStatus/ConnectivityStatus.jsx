import { CloudOff, HardDrive, Wifi } from 'lucide-react';

import { CONECTIVIDAD_INTERACCION } from '../../types/index.js';

const plural = (n) =>
  n === 1 ? '1 respuesta guardada' : `${n} respuestas guardadas`;

/*
 * Indicador de conectividad del chat sin conexión (RF-34). El estado se
 * dice con texto e ícono, no solo con color.
 *
 * Mientras no exista la sincronización (tarea 4) no se promete enviar
 * nada: al volver la conexión solo se informa cuántas respuestas siguen
 * en el dispositivo.
 */
export function ConnectivityStatus({ conectividad, pendientes, restablecida }) {
  const sinConexion = conectividad === CONECTIVIDAD_INTERACCION.SIN_CONEXION;
  const Icono = sinConexion ? CloudOff : Wifi;

  let texto;
  if (sinConexion) {
    texto = 'Sin conexión. Tus respuestas se guardan en este dispositivo.';
  } else if (restablecida) {
    texto = 'La conexión se ha restablecido.';
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
            La sincronización automática todavía no está disponible.
          </span>
        </p>
      )}
    </div>
  );
}
