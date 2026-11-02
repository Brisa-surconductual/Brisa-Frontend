export const initialAuthState = Object.freeze({
  user: null,
  role: null,
  estadoRegistro: null,
  idUsuario: null,
  alcance: null,
  limiteInactividadMinutos: null,
  isAuthenticated: false,
  endReason: null,
  remoteLogoutUnconfirmed: false,
});

// Un valor no numérico o no positivo se descarta (sin dato).
function toPositiveNumber(value) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

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
        /*
         * Alcance real de la sesión (LIMITADA | COMPLETA) que
         * entrega el backend. No se deduce del estado de registro.
         */
        alcance: action.payload.alcance ?? null,
        // Límite real de inactividad del backend para esta sesión.
        limiteInactividadMinutos: toPositiveNumber(
          action.payload.limiteInactividadMinutos,
        ),
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
