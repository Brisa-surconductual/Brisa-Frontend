import { describe, expect, it } from 'vitest';

import { AUTH_ACTION, authReducer, initialAuthState } from './authReducer.js';

const SESSION = Object.freeze({
  email: 'estudiante@usco.edu.co',
  role: 'ESTUDIANTE',
  estadoRegistro: 'REGISTRO_COMPLETO',
  idUsuario: 'id',
});

function loggedIn() {
  return authReducer(initialAuthState, {
    type: AUTH_ACTION.LOGIN,
    payload: SESSION,
  });
}

describe('Estado de la sesión al cerrar', () => {
  it('conserva el motivo de inactividad', () => {
    const state = authReducer(loggedIn(), {
      type: AUTH_ACTION.LOGOUT,
      payload: { reason: 'INACTIVITY' },
    });

    expect(state.isAuthenticated).toBe(false);
    expect(state.endReason).toBe('INACTIVITY');
    expect(state.remoteLogoutUnconfirmed).toBe(false);
  });

  it('conserva el motivo manual', () =>
    expect(
      authReducer(loggedIn(), {
        type: AUTH_ACTION.LOGOUT,
        payload: { reason: 'MANUAL' },
      }).endReason,
    ).toBe('MANUAL'));

  it('marca el cierre remoto sin confirmar', () => {
    const state = authReducer(loggedIn(), {
      type: AUTH_ACTION.LOGOUT,
      payload: { reason: 'MANUAL', remoteLogoutUnconfirmed: true },
    });

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.remoteLogoutUnconfirmed).toBe(true);
  });

  it('un nuevo inicio de sesión limpia el aviso de cierre sin confirmar', () => {
    const closed = authReducer(loggedIn(), {
      type: AUTH_ACTION.LOGOUT,
      payload: { remoteLogoutUnconfirmed: true },
    });

    const state = authReducer(closed, {
      type: AUTH_ACTION.LOGIN,
      payload: SESSION,
    });

    expect(state.isAuthenticated).toBe(true);
    expect(state.remoteLogoutUnconfirmed).toBe(false);
    expect(state.endReason).toBeNull();
  });

  it('el login conserva los datos de la sesión', () =>
    expect(loggedIn()).toEqual({
      user: { email: SESSION.email },
      role: SESSION.role,
      estadoRegistro: SESSION.estadoRegistro,
      idUsuario: SESSION.idUsuario,
      alcance: null,
      limiteInactividadMinutos: null,
      isAuthenticated: true,
      endReason: null,
      remoteLogoutUnconfirmed: false,
    }));
});

describe('Límite de inactividad de la sesión', () => {
  it('conserva el límite real que entrega el backend', () =>
    expect(
      authReducer(initialAuthState, {
        type: AUTH_ACTION.LOGIN,
        payload: { ...SESSION, limiteInactividadMinutos: 15 },
      }).limiteInactividadMinutos,
    ).toBe(15));

  it.each([undefined, null, 0, -5, '15', Number.NaN])(
    'descarta un límite inválido (%s)',
    (limite) =>
      expect(
        authReducer(initialAuthState, {
          type: AUTH_ACTION.LOGIN,
          payload: { ...SESSION, limiteInactividadMinutos: limite },
        }).limiteInactividadMinutos,
      ).toBeNull(),
  );
});

describe('Alcance de la sesión', () => {
  it('conserva el alcance real que entrega el backend', () =>
    expect(
      authReducer(initialAuthState, {
        type: AUTH_ACTION.LOGIN,
        payload: { ...SESSION, alcance: 'LIMITADA' },
      }).alcance,
    ).toBe('LIMITADA'));

  it('el cierre de sesión borra el alcance', () =>
    expect(
      authReducer(
        authReducer(initialAuthState, {
          type: AUTH_ACTION.LOGIN,
          payload: { ...SESSION, alcance: 'COMPLETA' },
        }),
        { type: AUTH_ACTION.LOGOUT, payload: {} },
      ).alcance,
    ).toBeNull());
});
