import { useEffect, useReducer, useState } from 'react';
import { AuthContext } from './authContext.js';
import { AUTH_ACTION, authReducer, initialAuthState } from './authReducer.js';
import { sesionActual } from '../../features/users/api/sesion.jsx';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

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

        if (data.csrfToken) {
          localStorage.setItem('csrfToken', data.csrfToken);
        }

        login({
          email: data.correoElectronico,
          role: data.rol,
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
    isAuthenticated: state.isAuthenticated,
    sessionEndReason: state.endReason,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
