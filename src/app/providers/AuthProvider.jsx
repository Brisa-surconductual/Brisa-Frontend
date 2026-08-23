import { useEffect, useReducer, useState } from 'react';

import { AuthContext } from './authContext.js';
import { AUTH_ACTION, authReducer, initialAuthState } from './authReducer.js';
import { sesionActual } from '../../features/users/api/sesion.jsx';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  /*
   * true mientras se verifica si hay una sesión válida
   * (cookie) al cargar la app. RequireAuth debe esperar
   * a que esto sea false antes de decidir si redirige.
   */
  const [isLoading, setIsLoading] = useState(true);

  function login({ email, role }) {
    dispatch({
      type: AUTH_ACTION.LOGIN,
      payload: { email, role },
    });
  }

  function logout({ reason = null } = {}) {
    dispatch({
      type: AUTH_ACTION.LOGOUT,
      payload: { reason },
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function rehydrateSession() {
      try {
        const data = await sesionActual();

        if (!isMounted) return;

        login({
          email: data.correoElectronico,
          role: data.rol,
        });
      } catch {
        /*
         * 401 esperado si no hay cookie válida: el usuario
         * simplemente no tiene sesión activa. No es un error
         * a mostrar, solo se queda deslogueado.
         */
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
    isAuthenticated: state.isAuthenticated,
    sessionEndReason: state.endReason,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
