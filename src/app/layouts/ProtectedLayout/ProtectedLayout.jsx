import { Outlet } from 'react-router-dom';

import {
  getSessionTimeoutConfig,
  SESSION_END_REASON,
} from '@/app/config/sessionConfig.js';

import { useAuth } from '@/app/providers/index.js';

import { SessionTimeoutModal } from '@/shared/components/ui/SessionTimeoutModal/index.js';

import { useInactivityTimeout } from '@/shared/hooks/useInactivityTimeout.js';

export function ProtectedLayout() {
  const {
    isAuthenticated,
    logout,
    session,
  } = useAuth();

  function endSession(reason) {
    logout({ reason });
  }

  /*
   * El límite de inactividad lo entrega Backend
   * al iniciar sesión.
   *
   * Si por alguna razón no está disponible,
   * sessionConfig utiliza el valor por defecto
   * definido para RF-08.
   */
  const timeoutConfig = getSessionTimeoutConfig(
    session?.limiteInactividadMinutos,
  );

  const {
    isWarning,
    remainingMs,
    extendSession,
  } = useInactivityTimeout({
    enabled: isAuthenticated,

    warningDelayMs:
      timeoutConfig.warningDelayMs,

    countdownMs:
      timeoutConfig.countdownMs,

    onTimeout: () =>
      endSession(
        SESSION_END_REASON.INACTIVITY,
      ),
  });

  return (
    <>
      <Outlet />

      <SessionTimeoutModal
        open={isWarning}
        remainingMs={remainingMs}
        onExtend={extendSession}
        onLogout={() =>
          endSession(
            SESSION_END_REASON.MANUAL,
          )
        }
      />
    </>
  );
}