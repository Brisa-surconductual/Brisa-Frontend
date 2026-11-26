import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  LOGOUT_PENDING_KEY,
  REMOTE_LOGOUT_RESULT,
  closeRemoteSession,
  clearPendingLogout,
  hasPendingLogout,
  restoreOrRetryLogout,
  runSingleFlight,
} from './remoteLogout.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    has: (key) => values.has(key),
  };
}

function httpError(status) {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status },
  });
}

function networkError() {
  return Object.assign(new Error('Network Error'), { isAxiosError: true });
}

describe('Cierre de sesión en el servidor', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('confirma el cierre y limpia el token CSRF cuando responde 200', async () => {
    const storage = createStorage({ csrfToken: 'token' });
    const requestLogout = vi.fn().mockResolvedValue({ mensaje: 'ok' });
    const renewCsrfToken = vi.fn();

    const result = await closeRemoteSession({
      requestLogout,
      renewCsrfToken,
      storage,
    });

    expect(result).toBe(REMOTE_LOGOUT_RESULT.CONFIRMED);
    expect(requestLogout).toHaveBeenCalledTimes(1);
    expect(renewCsrfToken).not.toHaveBeenCalled();
    expect(storage.has('csrfToken')).toBe(false);
    expect(hasPendingLogout(storage)).toBe(false);
  });

  it('trata el 401 como sesión ya cerrada en el servidor', async () => {
    const storage = createStorage({
      csrfToken: 'token',
      [LOGOUT_PENDING_KEY]: 'true',
    });

    const result = await closeRemoteSession({
      requestLogout: vi.fn().mockRejectedValue(httpError(401)),
      renewCsrfToken: vi.fn(),
      storage,
    });

    expect(result).toBe(REMOTE_LOGOUT_RESULT.ALREADY_CLOSED);
    expect(storage.has('csrfToken')).toBe(false);
    expect(hasPendingLogout(storage)).toBe(false);
  });

  it('ante 403 renueva el CSRF y reintenta una sola vez', async () => {
    const storage = createStorage();
    const requestLogout = vi
      .fn()
      .mockRejectedValueOnce(httpError(403))
      .mockResolvedValueOnce({ mensaje: 'ok' });
    const renewCsrfToken = vi.fn().mockResolvedValue({ csrfToken: 'nuevo' });

    const result = await closeRemoteSession({
      requestLogout,
      renewCsrfToken,
      storage,
    });

    expect(result).toBe(REMOTE_LOGOUT_RESULT.CONFIRMED);
    expect(renewCsrfToken).toHaveBeenCalledTimes(1);
    expect(requestLogout).toHaveBeenCalledTimes(2);
  });

  it('no confirma el cierre si el 403 persiste tras renovar el CSRF', async () => {
    const storage = createStorage({ csrfToken: 'token' });
    const requestLogout = vi.fn().mockRejectedValue(httpError(403));

    const result = await closeRemoteSession({
      requestLogout,
      renewCsrfToken: vi.fn().mockResolvedValue({}),
      storage,
    });

    expect(result).toBe(REMOTE_LOGOUT_RESULT.UNCONFIRMED);
    expect(requestLogout).toHaveBeenCalledTimes(2);
    expect(hasPendingLogout(storage)).toBe(true);
  });

  it('da la sesión por cerrada si la renovación del CSRF responde 401', async () => {
    const storage = createStorage();
    const requestLogout = vi.fn().mockRejectedValue(httpError(403));

    const result = await closeRemoteSession({
      requestLogout,
      renewCsrfToken: vi.fn().mockRejectedValue(httpError(401)),
      storage,
    });

    expect(result).toBe(REMOTE_LOGOUT_RESULT.ALREADY_CLOSED);
    expect(requestLogout).toHaveBeenCalledTimes(1);
    expect(hasPendingLogout(storage)).toBe(false);
  });

  it('no confirma el cierre ante un error de red y deja la marca pendiente', async () => {
    const storage = createStorage({ csrfToken: 'token' });

    const result = await closeRemoteSession({
      requestLogout: vi.fn().mockRejectedValue(networkError()),
      renewCsrfToken: vi.fn(),
      storage,
    });

    expect(result).toBe(REMOTE_LOGOUT_RESULT.UNCONFIRMED);
    expect(hasPendingLogout(storage)).toBe(true);
    // Se conserva para reintentar el cierre al volver a abrir la app.
    expect(storage.has('csrfToken')).toBe(true);
  });

  it('no confirma el cierre ante un 500', async () => {
    const storage = createStorage();

    const result = await closeRemoteSession({
      requestLogout: vi.fn().mockRejectedValue(httpError(500)),
      renewCsrfToken: vi.fn(),
      storage,
    });

    expect(result).toBe(REMOTE_LOGOUT_RESULT.UNCONFIRMED);
    expect(hasPendingLogout(storage)).toBe(true);
  });

  it('no confirma el cierre si el backend no responde a tiempo', async () => {
    vi.useFakeTimers();

    const storage = createStorage();
    const pending = closeRemoteSession({
      requestLogout: () => new Promise(() => {}),
      renewCsrfToken: vi.fn(),
      storage,
      deadlineMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toBe(REMOTE_LOGOUT_RESULT.UNCONFIRMED);
    expect(hasPendingLogout(storage)).toBe(true);
  });
});

describe('Cierres de sesión simultáneos', () => {
  it('comparten una sola solicitud mientras hay una en curso', async () => {
    const slot = { current: null };
    let finish;
    const start = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );

    // Botón "Cerrar sesión" y fin de la cuenta regresiva a la vez.
    const first = runSingleFlight(slot, start);
    const second = runSingleFlight(slot, start);

    expect(second).toBe(first);

    await Promise.resolve();
    finish(REMOTE_LOGOUT_RESULT.CONFIRMED);

    await expect(first).resolves.toBe(REMOTE_LOGOUT_RESULT.CONFIRMED);
    expect(start).toHaveBeenCalledTimes(1);
    expect(slot.current).toBeNull();
  });

  it('permite un nuevo cierre cuando el anterior terminó', async () => {
    const slot = { current: null };
    const start = vi.fn().mockResolvedValue(REMOTE_LOGOUT_RESULT.CONFIRMED);

    await runSingleFlight(slot, start);
    await runSingleFlight(slot, start);

    expect(start).toHaveBeenCalledTimes(2);
  });
});

/* Solicitud que respeta la señal: se rechaza al abortarse. */
function abortableRequest(onSignal) {
  return vi.fn(
    ({ signal }) =>
      new Promise((_, reject) => {
        onSignal?.(signal);
        signal.addEventListener('abort', () =>
          reject(
            Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' }),
          ),
        );
      }),
  );
}

describe('Plazo del cierre y respuestas tardías', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('entrega la misma señal a la solicitud de cierre y a la renovación', async () => {
    const storage = createStorage();
    const requestLogout = vi
      .fn()
      .mockRejectedValueOnce(httpError(403))
      .mockResolvedValueOnce({});
    const renewCsrfToken = vi.fn().mockResolvedValue({});

    await closeRemoteSession({ requestLogout, renewCsrfToken, storage });

    const [{ signal: logoutSignal }] = requestLogout.mock.calls[0];
    const [{ signal: renewSignal }] = renewCsrfToken.mock.calls[0];

    expect(logoutSignal).toBeInstanceOf(AbortSignal);
    expect(renewSignal).toBe(logoutSignal);
  });

  it('al vencer el plazo ABORTA la solicitud en curso', async () => {
    vi.useFakeTimers();

    let requestSignal;
    const storage = createStorage({ csrfToken: 'token' });
    const pending = closeRemoteSession({
      requestLogout: abortableRequest((signal) => {
        requestSignal = signal;
      }),
      renewCsrfToken: vi.fn(),
      storage,
      deadlineMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toBe(REMOTE_LOGOUT_RESULT.UNCONFIRMED);
    expect(requestSignal.aborted).toBe(true);
    expect(hasPendingLogout(storage)).toBe(true);
  });

  it('una respuesta 200 tardía no cambia el resultado ni el almacenamiento', async () => {
    vi.useFakeTimers();

    let respondLate;
    const storage = createStorage({ csrfToken: 'token' });
    // Solicitud que ignora la señal y responde después del plazo.
    const requestLogout = vi.fn(
      () =>
        new Promise((resolve) => {
          respondLate = resolve;
        }),
    );

    const pending = closeRemoteSession({
      requestLogout,
      renewCsrfToken: vi.fn(),
      storage,
      deadlineMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toBe(REMOTE_LOGOUT_RESULT.UNCONFIRMED);

    respondLate({ mensaje: 'ok' });
    await vi.advanceTimersByTimeAsync(0);

    expect(hasPendingLogout(storage)).toBe(true);
    expect(storage.getItem('csrfToken')).toBe('token');
  });

  it('tras vencer el plazo durante la renovación no envía otro cierre', async () => {
    vi.useFakeTimers();

    const storage = createStorage();
    const requestLogout = vi.fn().mockRejectedValueOnce(httpError(403));
    const renewCsrfToken = abortableRequest();

    const pending = closeRemoteSession({
      requestLogout,
      renewCsrfToken,
      storage,
      deadlineMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toBe(REMOTE_LOGOUT_RESULT.UNCONFIRMED);
    expect(requestLogout).toHaveBeenCalledTimes(1);
  });
});

describe('Cierre cancelado por un inicio de sesión nuevo', () => {
  it('aborta la solicitud y no toca el almacenamiento de la nueva sesión', async () => {
    let requestSignal;
    const storage = createStorage({ csrfToken: 'token-sesion-nueva' });
    const newSession = new AbortController();

    const pending = closeRemoteSession({
      requestLogout: abortableRequest((signal) => {
        requestSignal = signal;
      }),
      renewCsrfToken: vi.fn(),
      storage,
      signal: newSession.signal,
    });

    newSession.abort();

    await expect(pending).resolves.toBe(REMOTE_LOGOUT_RESULT.CANCELLED);
    expect(requestSignal.aborted).toBe(true);
    expect(hasPendingLogout(storage)).toBe(false);
    expect(storage.getItem('csrfToken')).toBe('token-sesion-nueva');
  });

  it('no envía la solicitud si ya estaba cancelado', async () => {
    const newSession = new AbortController();
    const requestLogout = vi.fn();

    newSession.abort();

    await expect(
      closeRemoteSession({
        requestLogout,
        renewCsrfToken: vi.fn(),
        storage: createStorage(),
        signal: newSession.signal,
      }),
    ).resolves.toBe(REMOTE_LOGOUT_RESULT.CANCELLED);
    expect(requestLogout).not.toHaveBeenCalled();
  });

  it('el login tras un cierre sin confirmar quita la marca pendiente', () => {
    const storage = createStorage({ [LOGOUT_PENDING_KEY]: 'true' });

    clearPendingLogout(storage);

    expect(hasPendingLogout(storage)).toBe(false);
  });

  it('la marca no guarda credenciales ni datos personales', async () => {
    const storage = createStorage();

    await closeRemoteSession({
      requestLogout: vi.fn().mockRejectedValue(networkError()),
      renewCsrfToken: vi.fn(),
      storage,
    });

    expect(storage.getItem(LOGOUT_PENDING_KEY)).toBe('true');
  });
});

describe('Arranque de la app con cierre pendiente', () => {
  it('reintenta el cierre y NO restaura la sesión', async () => {
    const retryLogout = vi.fn().mockResolvedValue();
    const restoreSession = vi.fn();

    await restoreOrRetryLogout({
      storage: createStorage({ [LOGOUT_PENDING_KEY]: 'true' }),
      retryLogout,
      restoreSession,
    });

    expect(retryLogout).toHaveBeenCalledTimes(1);
    expect(restoreSession).not.toHaveBeenCalled();
  });

  it('sin cierre pendiente restaura la sesión como siempre', async () => {
    const retryLogout = vi.fn();
    const restoreSession = vi.fn().mockResolvedValue();

    await restoreOrRetryLogout({
      storage: createStorage(),
      retryLogout,
      restoreSession,
    });

    expect(restoreSession).toHaveBeenCalledTimes(1);
    expect(retryLogout).not.toHaveBeenCalled();
  });
});
