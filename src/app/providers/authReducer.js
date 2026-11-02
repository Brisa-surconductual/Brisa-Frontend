export const initialAuthState = Object.freeze({
  user: null,
  role: null,
  estadoRegistro: null,
  idUsuario: null,
  isAuthenticated: false,
  endReason: null,
  remoteLogoutUnconfirmed: false,
});

export const AUTH_ACTION = Object.freeze({
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
});

export function authReducer(state, action) {
  switch (action.type) {
    /*
     * `user` es un objeto para poder sumar nombre o
     * identificador cuando exista backend, sin migrar
     * a los consumidores. El rol NO va dentro: es una
     * propiedad de la sesión, no del usuario.
     */
    case AUTH_ACTION.LOGIN:
      return {
        user: { email: action.payload.email },
        role: action.payload.role,
        estadoRegistro: action.payload.estadoRegistro,
        idUsuario: action.payload.idUsuario,
        isAuthenticated: true,
        endReason: null,
        remoteLogoutUnconfirmed: false,
      };

    /*
     * `remoteLogoutUnconfirmed` indica que el estado local
     * se limpió pero el backend no confirmó la invalidación
     * de la sesión: no debe mostrarse como cierre exitoso.
     */
    case AUTH_ACTION.LOGOUT:
      return {
        ...initialAuthState,
        endReason: action.payload?.reason ?? null,
        remoteLogoutUnconfirmed: Boolean(
          action.payload?.remoteLogoutUnconfirmed,
        ),
      };

    default:
      return state;
  }
}
