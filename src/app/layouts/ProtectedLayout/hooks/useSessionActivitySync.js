import { useEffect, useRef } from 'react';

import {
  ACTIVITY_RESULT,
  confirmSessionActivity,
  shouldSyncActivity,
} from '@/app/providers/sessionActivity.js';

import { registrarActividadSesion } from '@/features/users/api/actividadSesion.jsx';
import { sesionActual } from '@/features/users/api/sesion.jsx';

/*
 * Informa al backend la interacción real del usuario, como máximo
 * una vez por `syncIntervalMs` y con una sola solicitud en curso.
 * Al apagarse (sin sesión o con el cierre en curso) o desmontarse,
 * aborta la solicitud pendiente.
 */
export function useSessionActivitySync({
  enabled,
  syncIntervalMs,
  onExpired,
}) {
  const enabledRef = useRef(enabled);
  const lastAttemptAtRef = useRef(0);
  const inFlightRef = useRef(null);
  const controllerRef = useRef(null);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  });

  useEffect(() => {
    enabledRef.current = enabled;

    if (!enabled) return undefined;

    // La sesión acaba de validarse (login o restauración).
    lastAttemptAtRef.current = Date.now();

    return () => {
      enabledRef.current = false;
      controllerRef.current?.abort();
    };
  }, [enabled]);

  function run() {
    if (inFlightRef.current) return inFlightRef.current;

    const controller = new AbortController();

    controllerRef.current = controller;
    lastAttemptAtRef.current = Date.now();

    inFlightRef.current = confirmSessionActivity({
      requestActivity: registrarActividadSesion,
      renewCsrfToken: sesionActual,
      signal: controller.signal,
    })
      .then((result) => {
        if (result === ACTIVITY_RESULT.EXPIRED && enabledRef.current) {
          onExpiredRef.current?.();
        }

        if (result === ACTIVITY_RESULT.UNCONFIRMED) {
          console.warn('No se pudo confirmar la actividad de la sesión.');
        }

        return result;
      })
      .finally(() => {
        inFlightRef.current = null;

        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      });

    return inFlightRef.current;
  }

  // Interacción real del usuario (puntero, teclado, foco…).
  function notifyActivity() {
    if (!enabledRef.current) return;

    const isDue = shouldSyncActivity({
      now: Date.now(),
      lastAttemptAt: lastAttemptAtRef.current,
      intervalMs: syncIntervalMs,
      isInFlight: Boolean(inFlightRef.current),
    });

    if (isDue) void run();
  }

  // Confirmación explícita ("Seguir aquí"): sin esperar el intervalo.
  function confirmActivity() {
    if (!enabledRef.current) {
      return Promise.resolve(ACTIVITY_RESULT.CANCELLED);
    }

    return run();
  }

  return { notifyActivity, confirmActivity };
}
