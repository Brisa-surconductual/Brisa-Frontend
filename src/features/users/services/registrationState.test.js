import { describe, expect, it } from 'vitest';

import {
  REFRESHED_SESSION_ACTION,
  REGISTRATION_STATUS_VIEW,
  classifyRefreshedSession,
  getPostLoginPath,
  getRegistrationStatusView,
} from './registrationState.js';

describe('Destino después del login según el estado real', () => {
  it('REGISTRO_COMPLETO entra a la app como siempre', () =>
    expect(getPostLoginPath('REGISTRO_COMPLETO')).toBe('/app'));

  it('PENDIENTE_CONSENTIMIENTO conserva la navegación al consentimiento', () =>
    expect(getPostLoginPath('PENDIENTE_CONSENTIMIENTO')).toBe(
      '/registro/consentimiento',
    ));

  it('PENDIENTE_REVISION no va a la revisión, que no tiene los datos', () => {
    const path = getPostLoginPath('PENDIENTE_REVISION');

    expect(path).toBe('/app');
    expect(path).not.toMatch(/^\/registro/);
  });

  it.each([undefined, null, '', 'OTRO_ESTADO'])(
    'un estado desconocido (%s) no envía al registro',
    (estado) => expect(getPostLoginPath(estado)).toBe('/app'),
  );
});

describe('Presentación del estado de registro', () => {
  it('REGISTRO_COMPLETO con alcance COMPLETA se presenta como completado', () =>
    expect(getRegistrationStatusView('REGISTRO_COMPLETO', 'COMPLETA')).toBe(
      REGISTRATION_STATUS_VIEW.COMPLETED,
    ));

  it('PENDIENTE_REVISION se presenta como pendiente de revisión', () =>
    expect(getRegistrationStatusView('PENDIENTE_REVISION')).toBe(
      REGISTRATION_STATUS_VIEW.PENDING_REVIEW,
    ));

  it('PENDIENTE_CONSENTIMIENTO se presenta como consentimiento pendiente', () =>
    expect(getRegistrationStatusView('PENDIENTE_CONSENTIMIENTO')).toBe(
      REGISTRATION_STATUS_VIEW.PENDING_CONSENT,
    ));

  it.each([undefined, null, '', 'registro_completo', 'OTRO_ESTADO'])(
    'un estado desconocido (%s) nunca se presenta como completado',
    (estado) =>
      expect(getRegistrationStatusView(estado)).toBe(
        REGISTRATION_STATUS_VIEW.UNKNOWN,
      ),
  );
});

describe('Estado de registro frente al alcance de la sesión', () => {
  it.each(['LIMITADA', null, undefined, 'OTRO'])(
    'REGISTRO_COMPLETO con alcance %s no se presenta como completado',
    (alcance) =>
      expect(getRegistrationStatusView('REGISTRO_COMPLETO', alcance)).toBe(
        REGISTRATION_STATUS_VIEW.LIMITED_SESSION,
      ),
  );

  it('REGISTRO_COMPLETO + LIMITADA no afirma consentimiento pendiente', () =>
    expect(
      getRegistrationStatusView('REGISTRO_COMPLETO', 'LIMITADA'),
    ).not.toBe(REGISTRATION_STATUS_VIEW.PENDING_CONSENT));

  it('los estados pendientes no dependen del alcance', () => {
    expect(getRegistrationStatusView('PENDIENTE_REVISION', 'COMPLETA')).toBe(
      REGISTRATION_STATUS_VIEW.PENDING_REVIEW,
    );
    expect(
      getRegistrationStatusView('PENDIENTE_CONSENTIMIENTO', 'LIMITADA'),
    ).toBe(REGISTRATION_STATUS_VIEW.PENDING_CONSENT);
  });

  it('un estado desconocido con alcance COMPLETA sigue siendo desconocido', () =>
    expect(getRegistrationStatusView(undefined, 'COMPLETA')).toBe(
      REGISTRATION_STATUS_VIEW.UNKNOWN,
    ));
});

describe('Sesión consultada tras aceptar el consentimiento', () => {
  const SESSION = Object.freeze({
    idUsuario: 'id-a',
    correoElectronico: 'estudiante.prueba@example.com',
    rol: 'ESTUDIANTE',
    estadoRegistro: 'REGISTRO_COMPLETO',
    alcance: 'LIMITADA',
  });

  it('adopta la sesión de la misma identidad', () =>
    expect(
      classifyRefreshedSession({ session: SESSION, expectedUserId: 'id-a' }),
    ).toBe(REFRESHED_SESSION_ACTION.ACCEPT));

  it('descarta la identidad si la sesión es de otra cuenta', () =>
    expect(
      classifyRefreshedSession({ session: SESSION, expectedUserId: 'id-b' }),
    ).toBe(REFRESHED_SESSION_ACTION.END));

  it('descarta la identidad si la sesión no trae idUsuario', () =>
    expect(
      classifyRefreshedSession({
        session: { ...SESSION, idUsuario: undefined },
        expectedUserId: undefined,
      }),
    ).toBe(REFRESHED_SESSION_ACTION.END));

  it('descarta la identidad si la sesión ya expiró (401)', () =>
    expect(
      classifyRefreshedSession({
        error: { response: { status: 401 } },
        expectedUserId: 'id-a',
      }),
    ).toBe(REFRESHED_SESSION_ACTION.END));

  it('un error de red deja el estado sin confirmar', () =>
    expect(
      classifyRefreshedSession({
        error: new Error('Network Error'),
        expectedUserId: 'id-a',
      }),
    ).toBe(REFRESHED_SESSION_ACTION.UNKNOWN));
});
