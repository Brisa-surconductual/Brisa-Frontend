import { useReducer } from 'react';

import { AuthContext } from './authContext.js';

import {
  AUTH_ACTION,
  authReducer,
  initialAuthState,
} from './authReducer.js';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(
    authReducer,
    initialAuthState,
  );

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
   * TODO(#147): definir aquí la persistencia real
   * de la sesión cuando exista backend. Por ahora
   * la sesión vive solo en memoria.
   */

  const value = {
    user: state.user,
    role: state.role,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
