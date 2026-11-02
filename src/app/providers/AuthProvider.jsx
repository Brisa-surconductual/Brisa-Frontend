import { useEffect, useReducer, useRef, useState } from 'react';
import { AuthContext } from './authContext.js';
import { AUTH_ACTION, authReducer, initialAuthState } from './authReducer.js';
import {
  REMOTE_LOGOUT_RESULT,
  clearPendingLogout,
  closeRemoteSession,
  restoreOrRetryLogout,
  runSingleFlight,
} from './remoteLogout.js';
import { sesionActual } from '../../features/users/api/sesion.jsx';
import { cerrarSesion } from '../../features/users/api/logout.jsx';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const [isLoading, setIsLoading] = useState(true);
  const [isEndingSession, setIsEndingSession] = useState(false);

  const endSessionRef = useRef(null);
  const endSessionAbortRef = useRef(null);

  function login({ email, role, estadoRegistro, idUsuario }) {
    /*
     * Una sesión nueva reemplaza la cookie anterior: se cancela
     * cualquier cierre en curso para que su respuesta tardía no
     * cierre ni limpie esta sesión.
     */
    endSessionAbortRef.current?.abort();
    clearPendingLogout(localStorage);

    dispatch({
      type: AUTH_ACTION.LOGIN,
      payload: { email, role, estadoRegistro, idUsuario },
    });
  }

  /*
   * Cierre solo local. Se conserva para los flujos que no
   * cierran sesión en el servidor (p. ej. cancelar el
   * consentimiento). Para cerrar sesión usar `endSession`.
   */
  function logout({ reason = null } = {}) {
    dispatch({
      type: AUTH_ACTION.LOGOUT,
      payload: { reason },
    });
  }

  /*
   * Único punto de cierre de sesión: pide la invalidación al
   * backend y después limpia el estado local. Las llamadas
   * concurrentes (botón + cuenta regresiva) comparten la misma
   * solicitud.
   */
  function endSession({ reason = null } = {}) {
    return runSingleFlight(endSessionRef, async () => {
      const controller = new AbortController();

      endSessionAbortRef.current = controller;
      setIsEndingSession(true);

      try {
        const result = await closeRemoteSession({
          requestLogout: cerrarSesion,
          renewCsrfToken: sesionActual,
          storage: localStorage,
          signal: controller.signal,
        });

        // Cancelado por un login posterior: esa sesión manda.
        if (result !== REMOTE_LOGOUT_RESULT.CANCELLED) {
          dispatch({
            type: AUTH_ACTION.LOGOUT,
            payload: {
              reason,
              remoteLogoutUnconfirmed:
                result === REMOTE_LOGOUT_RESULT.UNCONFIRMED,
            },
          });
        }

        return result;
      } finally {
        if (endSessionAbortRef.current === controller) {
          endSessionAbortRef.current = null;
        }

        setIsEndingSession(false);
      }
    });
  }

  /*
   * El login espera a que termine un cierre en curso antes de
   * enviar credenciales: así ninguna respuesta del cierre puede
   * llegar después de la cookie de la nueva sesión.
   */
  function waitForSessionEnd() {
    return endSessionRef.current ?? Promise.resolve();
  }

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const data = await sesionActual();

      if (!isMounted) return;

      if (data.csrfToken) {
        localStorage.setItem('csrfToken', data.csrfToken);
      }

      login({
        email: data.correoElectronico,
        role: data.rol,
        estadoRegistro: data.estadoRegistro,
        idUsuario: data.idUsuario,
      });
    }

    async function rehydrateSession() {
      try {
        /*
         * Un cierre anterior sin confirmar: se reintenta en
         * lugar de restaurar la sesión con la cookie.
         */
        await restoreOrRetryLogout({
          storage: localStorage,
          retryLogout: () => endSession(),
          restoreSession,
        });
      } catch (error) {
        console.error('Error rehidratando la sesión:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    rehydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = {
    user: state.user,
    role: state.role,
    idUsuario: state.idUsuario,
    estadoRegistro: state.estadoRegistro,
    isAuthenticated: state.isAuthenticated,
    sessionEndReason: state.endReason,
    remoteLogoutUnconfirmed: state.remoteLogoutUnconfirmed,
    isEndingSession,
    isLoading,
    login,
    logout,
    endSession,
    waitForSessionEnd,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
