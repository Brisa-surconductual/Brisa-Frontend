export const initialAuthState = Object.freeze({
  user: null,
  role: null,
  isAuthenticated: false,
});

export const AUTH_ACTION = Object.freeze({
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
});

export function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTION.LOGIN:
      return {
        user: action.payload.email,
        role: action.payload.role,
        isAuthenticated: true,
      };

    case AUTH_ACTION.LOGOUT:
      return initialAuthState;

    default:
      return state;
  }
}
