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
  const { isAuthenticated, logout } = useAuth();

  /*
   * Solo cierra la sesión: el redirect a /login lo hace
   * RequireAuth al quedarse sin sesión. Navegar también
   * desde aquí competía con esa redirección y descartaba
   * el state de la navegación, por eso el motivo viaja
   * en la sesión.
   */
  function endSession(reason) {
    logout({ reason });
  }

  const { isWarning, remainingMs, extendSession } = useInactivityTimeout({
    enabled: isAuthenticated,
    warningDelayMs: SESSION_TIMEOUT.warningDelayMs,
    countdownMs: SESSION_TIMEOUT.countdownMs,
    onTimeout: () => endSession(SESSION_END_REASON.INACTIVITY),
  });

  return (
    <>
      <Outlet />

      <SessionTimeoutModal
        open={isWarning}
        remainingMs={remainingMs}
        onExtend={extendSession}
        onLogout={() => endSession(SESSION_END_REASON.MANUAL)}
      />
    </>
  );
}
