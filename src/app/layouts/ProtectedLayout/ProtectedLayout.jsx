import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import {
  SESSION_END_REASON,
  getActivitySyncIntervalMs,
  resolveSessionTimeout,
} from '@/app/config/sessionConfig.js';
import { useAuth } from '@/app/providers/index.js';
import { ACTIVITY_RESULT } from '@/app/providers/sessionActivity.js';

import { SessionTimeoutModal } from '@/shared/components/ui/SessionTimeoutModal/index.js';
import { useInactivityTimeout } from '@/shared/hooks/useInactivityTimeout.js';

import { useSessionActivitySync } from './hooks/useSessionActivitySync.js';

const EXTEND_ERROR_MESSAGE =
  'No pudimos confirmar tu sesión con el servidor. Intenta de nuevo.';

/*
 * Envuelve toda la zona protegida: el control de
 * inactividad se monta una sola vez y cubre por igual
 * a estudiante y a psicología.
 */
export function ProtectedLayout() {
  const {
    isAuthenticated,
    isEndingSession,
    limiteInactividadMinutos,
    endSession: closeSession,
  } = useAuth();

  /*
   * El aviso sigue abierto mientras el backend confirma el
   * cierre: el contenido protegido no debe quedar a la vista
   * en un equipo desatendido.
   */
  const [isClosingFromWarning, setIsClosingFromWarning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState('');

  const isSessionActive = isAuthenticated && !isEndingSession;

  // Tiempos alineados con el límite real del backend.
  const timeout = resolveSessionTimeout(limiteInactividadMinutos);

  const { notifyActivity, confirmActivity } = useSessionActivitySync({
    enabled: isSessionActive,
    syncIntervalMs: getActivitySyncIntervalMs(limiteInactividadMinutos),
    onExpired: () => endSession(SESSION_END_REASON.EXPIRED),
  });

  /*
   * Solo cierra la sesión: el redirect a /login lo hace
   * RequireAuth al quedarse sin sesión. Navegar también
   * desde aquí competía con esa redirección y descartaba
   * el state de la navegación, por eso el motivo viaja
   * en la sesión.
   */
  function endSession(reason) {
    if (isWarning) setIsClosingFromWarning(true);

    void closeSession({ reason }).finally(() =>
      setIsClosingFromWarning(false),
    );
  }

  /*
   * Mientras el backend responde al cierre la vigilancia se
   * apaga: el aviso no debe reaparecer ni disparar otro cierre.
   */
  const { isWarning, remainingMs, extendSession } = useInactivityTimeout({
    enabled: isSessionActive,
    warningDelayMs: timeout.warningDelayMs,
    countdownMs: timeout.countdownMs,
    onTimeout: () => endSession(SESSION_END_REASON.INACTIVITY),
    onActivity: notifyActivity,
  });

  /*
   * "Seguir aquí" confirma la sesión con el backend antes de
   * reiniciar el contador: no se extiende una sesión rechazada.
   */
  async function handleExtend() {
    if (isExtending) return;

    setIsExtending(true);
    setExtendError('');

    const result = await confirmActivity();

    setIsExtending(false);

    if (result === ACTIVITY_RESULT.ACTIVE) {
      extendSession();
      return;
    }

    if (result === ACTIVITY_RESULT.UNCONFIRMED) {
      setExtendError(EXTEND_ERROR_MESSAGE);
    }

    // EXPIRED: el cierre ya se inició. CANCELLED: ya estaba en curso.
  }

  return (
    <>
      <Outlet />

      <SessionTimeoutModal
        open={isWarning || isClosingFromWarning}
        remainingMs={remainingMs}
        // Con el cierre ya en curso no se puede seguir en la sesión.
        onExtend={isClosingFromWarning ? undefined : handleExtend}
        isExtending={isExtending}
        extendError={isClosingFromWarning ? '' : extendError}
        onLogout={() => endSession(SESSION_END_REASON.MANUAL)}
      />
    </>
  );
}
