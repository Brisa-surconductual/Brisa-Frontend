export const initialAuthState = Object.freeze({
  user: null,
  role: null,
  isAuthenticated: false,

  session: null,

  /*
   * Motivo por el cual terminó la última sesión.
   */
  endReason: null,
});

export const AUTH_ACTION = Object.freeze({
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
});

export function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTION.LOGIN:
      return {
        user: {
          id: action.payload.idUsuario ?? null,
          email: action.payload.email ?? null,
        },

        role: action.payload.role,

        isAuthenticated: true,

        session: {
          backendRole: action.payload.backendRole ?? null,

          alcance: action.payload.alcance ?? null,

          estadoRegistro: action.payload.estadoRegistro ?? null,

          siguienteAccion: action.payload.siguienteAccion ?? null,

          csrfToken: action.payload.csrfToken ?? null,

          limiteInactividadMinutos:
            action.payload.limiteInactividadMinutos ?? null,
        },

        endReason: null,
      };

    case AUTH_ACTION.LOGOUT:
      return {
        ...initialAuthState,

        endReason: action.payload?.reason ?? null,
      };

    default:
      return state;
  }
}
