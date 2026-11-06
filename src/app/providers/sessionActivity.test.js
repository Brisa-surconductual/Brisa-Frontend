import { describe, expect, it, vi } from 'vitest';

import {
  ACTIVITY_RESULT,
  confirmSessionActivity,
  shouldSyncActivity,
} from './sessionActivity.js';

function httpError(status) {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status },
  });
}

function confirm({ requestActivity, renewCsrfToken = vi.fn(), signal }) {
  return confirmSessionActivity({ requestActivity, renewCsrfToken, signal });
}

describe('Confirmación de actividad con el backend', () => {
  it('200: la sesión sigue activa y se envía el DTO del contrato', async () => {
    const requestActivity = vi.fn().mockResolvedValue({ activa: true });

    await expect(confirm({ requestActivity })).resolves.toBe(
      ACTIVITY_RESULT.ACTIVE,
    );
    expect(requestActivity).toHaveBeenCalledWith(
      expect.objectContaining({ estadoAplicacion: 'ACTIVA' }),
    );
  });

  it('401: la sesión no es válida', async () =>
    expect(
      confirm({ requestActivity: vi.fn().mockRejectedValue(httpError(401)) }),
    ).resolves.toBe(ACTIVITY_RESULT.EXPIRED));

  it('403: renueva el CSRF y reintenta una sola vez', async () => {
    const requestActivity = vi
      .fn()
      .mockRejectedValueOnce(httpError(403))
      .mockResolvedValueOnce({});
    const renewCsrfToken = vi.fn().mockResolvedValue({});

    await expect(confirm({ requestActivity, renewCsrfToken })).resolves.toBe(
      ACTIVITY_RESULT.ACTIVE,
    );
    expect(renewCsrfToken).toHaveBeenCalledTimes(1);
    expect(requestActivity).toHaveBeenCalledTimes(2);
  });

  it('403 persistente: no confirma ni inventa permisos', async () => {
    const requestActivity = vi.fn().mockRejectedValue(httpError(403));

    await expect(
      confirm({
        requestActivity,
        renewCsrfToken: vi.fn().mockResolvedValue({}),
      }),
    ).resolves.toBe(ACTIVITY_RESULT.UNCONFIRMED);
    expect(requestActivity).toHaveBeenCalledTimes(2);
  });

  it('403 y la renovación responde 401: la sesión no es válida', async () =>
    expect(
      confirm({
        requestActivity: vi.fn().mockRejectedValue(httpError(403)),
        renewCsrfToken: vi.fn().mockRejectedValue(httpError(401)),
      }),
    ).resolves.toBe(ACTIVITY_RESULT.EXPIRED));

  it('error de red o 500: sin confirmación', async () => {
    await expect(
      confirm({
        requestActivity: vi.fn().mockRejectedValue(new Error('Network Error')),
      }),
    ).resolves.toBe(ACTIVITY_RESULT.UNCONFIRMED);
    await expect(
      confirm({ requestActivity: vi.fn().mockRejectedValue(httpError(500)) }),
    ).resolves.toBe(ACTIVITY_RESULT.UNCONFIRMED);
  });

  it('abortada antes de enviar (cierre en curso): no se envía', async () => {
    const controller = new AbortController();
    const requestActivity = vi.fn();

    controller.abort();

    await expect(
      confirm({ requestActivity, signal: controller.signal }),
    ).resolves.toBe(ACTIVITY_RESULT.CANCELLED);
    expect(requestActivity).not.toHaveBeenCalled();
  });

  it('abortada durante la solicitud: no se toma como expiración', async () => {
    const controller = new AbortController();
    const requestActivity = vi.fn(async () => {
      controller.abort();
      throw httpError(401);
    });

    await expect(
      confirm({ requestActivity, signal: controller.signal }),
    ).resolves.toBe(ACTIVITY_RESULT.CANCELLED);
  });
});

describe('Frecuencia de sincronización de actividad', () => {
  const INTERVAL = 120_000;

  it('no sincroniza antes del intervalo', () =>
    expect(
      shouldSyncActivity({
        now: 100_000,
        lastAttemptAt: 0,
        intervalMs: INTERVAL,
        isInFlight: false,
      }),
    ).toBe(false));

  it('sincroniza cuando pasó el intervalo', () =>
    expect(
      shouldSyncActivity({
        now: 120_000,
        lastAttemptAt: 0,
        intervalMs: INTERVAL,
        isInFlight: false,
      }),
    ).toBe(true));

  it('no duplica una solicitud en curso', () =>
    expect(
      shouldSyncActivity({
        now: 999_999,
        lastAttemptAt: 0,
        intervalMs: INTERVAL,
        isInFlight: true,
      }),
    ).toBe(false));

  it('un usuario activo sin pausa genera como máximo una por intervalo', () => {
    let lastAttemptAt = 0;
    let requests = 0;

    // Interacción cada segundo durante 10 minutos.
    for (let now = 1000; now <= 600_000; now += 1000) {
      if (
        shouldSyncActivity({
          now,
          lastAttemptAt,
          intervalMs: INTERVAL,
          isInFlight: false,
        })
      ) {
        requests += 1;
        lastAttemptAt = now;
      }
    }

    expect(requests).toBe(5);
  });
});
