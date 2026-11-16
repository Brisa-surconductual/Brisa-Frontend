import { AlertTriangle, FlaskConical, RefreshCw } from 'lucide-react';

import {
  ESTADO_SINCRONIZACION_SESION,
  MENSAJE_SINCRONIZACION,
} from '../../types/index.js';

const { PENDIENTE_DE_RESOLUCION } = ESTADO_SINCRONIZACION_SESION;

function Linea({ icono: Icono, children }) {
  return (
    <p className="m-0 flex items-start gap-[var(--space-2)]">
      <Icono
        size={18}
        strokeWidth={1.8}
        aria-hidden="true"
        className="mt-px shrink-0"
      />
      <span>{children}</span>
    </p>
  );
}

/*
 * Estado de sincronización de una sesión (tarea 4), en texto. `sesion` es
 * el estado que publica el coordinador (o undefined si aún no la vio).
 * El mensaje de un rechazo se muestra tal cual lo envía el servidor.
 */
export function SyncStatus({ sesion, simulada }) {
  const mensaje = sesion ? MENSAJE_SINCRONIZACION[sesion.estado] : null;
  const rechazo = sesion?.estado === PENDIENTE_DE_RESOLUCION && sesion.error;

  return (
    <>
      {mensaje && <Linea icono={RefreshCw}>{mensaje}</Linea>}

      {rechazo && (
        <Linea icono={AlertTriangle}>
          {sesion.error.mensaje ?? `Código: ${sesion.error.codigo}`}
        </Linea>
      )}

      {sesion?.reconciliacion?.coincide === false && (
        <Linea icono={AlertTriangle}>
          {MENSAJE_SINCRONIZACION.DISCREPANCIA_NODO}
        </Linea>
      )}

      {simulada && (
        <Linea icono={FlaskConical}>
          Sincronización simulada en este navegador: no se envía información al
          servidor.
        </Linea>
      )}
    </>
  );
}
