import { describe, expect, it, vi } from 'vitest';

import {
  REGISTRATION_OUTCOME,
  completeRegistration,
} from './completeRegistration.js';

const PAYLOAD = Object.freeze({
  correoElectronico: 'estudiante.prueba@example.com',
  contrasena: 'Clave#2026',
  ciudad: 'Neiva',
});

// Forma real de CreacionUsuarioDtoResponse (snake_case).
const CREATED_ACCOUNT = Object.freeze({
  correo_electronico: 'estudiante.prueba@example.com',
  rol: 'ESTUDIANTE',
  estado_registro: 'REGISTRO_COMPLETO',
  estado_cuenta: 'ACTIVA',
});

// Forma real de SesionActualDtoResponse (camelCase).
const SESSION = Object.freeze({
  idUsuario: 'id-usuario',
  correoElectronico: 'estudiante.prueba@example.com',
  alcance: 'COMPLETA',
  estadoRegistro: 'REGISTRO_COMPLETO',
  rol: 'ESTUDIANTE',
  csrfToken: 'csrf',
  limiteInactividadMinutos: 15,
});

function httpError(status, message) {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, data: { message } },
  });
}

function run({ createAccount, fetchSession }) {
  return completeRegistration({
    payload: PAYLOAD,
    createAccount,
    fetchSession,
  });
}

describe('Finalización del registro', () => {
  it('crea la cuenta y después consulta la sesión real', async () => {
    const order = [];
    const createAccount = vi.fn(async () => {
      order.push('crear');
      return CREATED_ACCOUNT;
    });
    const fetchSession = vi.fn(async () => {
      order.push('sesion');
      return SESSION;
    });

    const result = await run({ createAccount, fetchSession });

    expect(result.outcome).toBe(REGISTRATION_OUTCOME.SESSION_READY);
    expect(result.session).toBe(SESSION);
    expect(result.createdAccount).toBe(CREATED_ACCOUNT);
    expect(order).toEqual(['crear', 'sesion']);
  });

  it('envía el payload sin modificarlo', async () => {
    const createAccount = vi.fn().mockResolvedValue(CREATED_ACCOUNT);

    await run({ createAccount, fetchSession: vi.fn().mockResolvedValue(SESSION) });

    expect(createAccount).toHaveBeenCalledWith(PAYLOAD);
  });

  it('acepta el correo de la sesión sin distinguir mayúsculas', async () => {
    const result = await run({
      createAccount: vi.fn().mockResolvedValue(CREATED_ACCOUNT),
      fetchSession: vi.fn().mockResolvedValue({
        ...SESSION,
        correoElectronico: 'Estudiante.Prueba@Example.com',
      }),
    });

    expect(result.outcome).toBe(REGISTRATION_OUTCOME.SESSION_READY);
  });
});

describe('Cuenta creada con sesión no disponible', () => {
  it('si falla la consulta de sesión no repite el POST de creación', async () => {
    const createAccount = vi.fn().mockResolvedValue(CREATED_ACCOUNT);

    const result = await run({
      createAccount,
      fetchSession: vi.fn().mockRejectedValue(httpError(401)),
    });

    expect(result.outcome).toBe(REGISTRATION_OUTCOME.SESSION_UNAVAILABLE);
    expect(result.createdAccount).toBe(CREATED_ACCOUNT);
    expect(createAccount).toHaveBeenCalledTimes(1);
  });

  it('un error de red en la sesión no se interpreta como registro fallido', async () => {
    const result = await run({
      createAccount: vi.fn().mockResolvedValue(CREATED_ACCOUNT),
      fetchSession: vi.fn().mockRejectedValue(new Error('Network Error')),
    });

    expect(result.outcome).toBe(REGISTRATION_OUTCOME.SESSION_UNAVAILABLE);
  });

  it('no acepta la sesión de otra cuenta', async () => {
    const result = await run({
      createAccount: vi.fn().mockResolvedValue(CREATED_ACCOUNT),
      fetchSession: vi.fn().mockResolvedValue({
        ...SESSION,
        correoElectronico: 'otra.cuenta@example.com',
      }),
    });

    expect(result.outcome).toBe(REGISTRATION_OUTCOME.SESSION_UNAVAILABLE);
  });

  it('no acepta una sesión con otro rol o sin idUsuario', async () => {
    for (const session of [
      { ...SESSION, rol: 'ADMINISTRATIVO' },
      { ...SESSION, idUsuario: undefined },
    ]) {
      const result = await run({
        createAccount: vi.fn().mockResolvedValue(CREATED_ACCOUNT),
        fetchSession: vi.fn().mockResolvedValue(session),
      });

      expect(result.outcome).toBe(REGISTRATION_OUTCOME.SESSION_UNAVAILABLE);
    }
  });
});

describe('Errores de creación', () => {
  it('un rechazo del backend conserva el error y no consulta la sesión', async () => {
    const error = httpError(400, ['fechaNacimiento debe ser una fecha válida']);
    const fetchSession = vi.fn();

    const result = await run({
      createAccount: vi.fn().mockRejectedValue(error),
      fetchSession,
    });

    expect(result).toEqual({
      outcome: REGISTRATION_OUTCOME.CREATION_REJECTED,
      error,
    });
    expect(fetchSession).not.toHaveBeenCalled();
  });

  it('un 500 del backend se trata como rechazo', async () => {
    const result = await run({
      createAccount: vi.fn().mockRejectedValue(httpError(500)),
      fetchSession: vi.fn(),
    });

    expect(result.outcome).toBe(REGISTRATION_OUTCOME.CREATION_REJECTED);
  });

  it.each([
    ['un error de red', new Error('Network Error')],
    ['una pasarela 504', httpError(504)],
    ['una pasarela 502', httpError(502)],
  ])('%s deja la creación incierta sin reintentar', async (_, error) => {
    const createAccount = vi.fn().mockRejectedValue(error);
    const fetchSession = vi.fn();

    const result = await run({ createAccount, fetchSession });

    expect(result.outcome).toBe(REGISTRATION_OUTCOME.CREATION_UNCERTAIN);
    expect(createAccount).toHaveBeenCalledTimes(1);
    expect(fetchSession).not.toHaveBeenCalled();
  });
});
