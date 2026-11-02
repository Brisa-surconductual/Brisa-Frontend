import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import {
  SESSION_END_REASON,
  SESSION_TIMEOUT,
} from '@/app/config/sessionConfig.js';
import { useAuth } from '@/app/providers/index.js';

import { SessionTimeoutModal } from '@/shared/components/ui/SessionTimeoutModal/index.js';
import { useInactivityTimeout } from '@/shared/hooks/useInactivityTimeout.js';

/*
 * Envuelve toda la zona protegida: el control de
 * inactividad se monta una sola vez y cubre por igual
 * a estudiante y a psicología.
 */
export function ProtectedLayout() {
  const { isAuthenticated, isEndingSession, endSession: closeSession } =
    useAuth();

  /*
   * El aviso sigue abierto mientras el backend confirma el
   * cierre: el contenido protegido no debe quedar a la vista
   * en un equipo desatendido.
   */
  const [isClosingFromWarning, setIsClosingFromWarning] = useState(false);

  /*
   * Solo cierra la sesión: el redirect a /login lo hace
   * RequireAuth al quedarse sin sesión. Navegar también
   * desde aquí competía con esa redirección y descartaba
   * el state de la navegación, por eso el motivo viaja
   * en la sesión.
   */
  function endSession(reason) {
    setIsClosingFromWarning(true);

    void closeSession({ reason }).finally(() =>
      setIsClosingFromWarning(false),
    );
  }

  /*
   * Mientras el backend responde al cierre la vigilancia se
   * apaga: el aviso no debe reaparecer ni disparar otro cierre.
   */
  const { isWarning, remainingMs, extendSession } = useInactivityTimeout({
    enabled: isAuthenticated && !isEndingSession,
    warningDelayMs: SESSION_TIMEOUT.warningDelayMs,
    countdownMs: SESSION_TIMEOUT.countdownMs,
    onTimeout: () => endSession(SESSION_END_REASON.INACTIVITY),
  });

  return (
    <>
      <Outlet />

      <SessionTimeoutModal
        open={isWarning || isClosingFromWarning}
        remainingMs={remainingMs}
        // Con el cierre ya en curso no se puede seguir en la sesión.
        onExtend={isClosingFromWarning ? undefined : extendSession}
        onLogout={() => endSession(SESSION_END_REASON.MANUAL)}
      />
    </>
  );
}
