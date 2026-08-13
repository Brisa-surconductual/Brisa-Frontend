import { useReducer } from 'react';

import { AuthContext } from './authContext.js';

import { AUTH_ACTION, authReducer, initialAuthState } from './authReducer.js';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  function login(session) {
    dispatch({
      type: AUTH_ACTION.LOGIN,
      payload: session,
    });
  }

  function logout({ reason = null } = {}) {
    dispatch({
      type: AUTH_ACTION.LOGOUT,
      payload: { reason },
    });
  }

  const value = {
    user: state.user,
    role: state.role,

    session: state.session,

    isAuthenticated: state.isAuthenticated,

    sessionEndReason: state.endReason,

    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
