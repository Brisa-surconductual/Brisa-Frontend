import { useReducer } from 'react';

import { AuthContext } from './authContext.js';

import { AUTH_ACTION, authReducer, initialAuthState } from './authReducer.js';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  function login({ email, role }) {
    dispatch({
      type: AUTH_ACTION.LOGIN,
      payload: { email, role },
    });
  }

  function logout() {
    dispatch({ type: AUTH_ACTION.LOGOUT });
  }

  /*
   * La sesión vive SOLO en memoria: al recargar se
   * pierde. Aquí irá la persistencia real (rehidratar
   * al montar y limpiar en logout) cuando el backend
   * emita el token de sesión.
   */

  const value = {
    user: state.user,
    role: state.role,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
