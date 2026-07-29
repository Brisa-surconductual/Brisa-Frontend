import { useEffect, useRef, useState } from 'react';

/*
 * Eventos que cuentan como interacción del usuario.
 * `passive` evita bloquear el scroll en móvil.
 */
const ACTIVITY_EVENTS = Object.freeze([
  'pointerdown',
  'keydown',
  'touchstart',
  'mousemove',
  'wheel',
  'focusin',
]);

const CHECK_INTERVAL_MS = 250;

/*
 * Vigila la inactividad del usuario. Tras `warningDelayMs`
 * sin interacción levanta `isWarning`; si pasan además
 * `countdownMs` sin que se llame a `extendSession`, invoca
 * `onTimeout`.
 *
 * Durante la advertencia la interacción pasiva NO extiende
 * la sesión: el usuario debe confirmarlo explícitamente,
 * que es justamente lo que comprueba el aviso.
 *
 * Se mide con marcas de tiempo, no con temporizadores
 * encadenados: si el navegador ralentiza la pestaña en
 * segundo plano, al volver se detecta el tiempo real
 * transcurrido.
 */
export function useInactivityTimeout({
  enabled = true,
  warningDelayMs,
  countdownMs,
  onTimeout,
}) {
  const [isWarning, setIsWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(countdownMs);

  const lastActivityAtRef = useRef(null);
  const warningStartedAtRef = useRef(null);
  const isWarningRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  function extendSession() {
    lastActivityAtRef.current = Date.now();
    warningStartedAtRef.current = null;
    isWarningRef.current = false;

    setIsWarning(false);
    setRemainingMs(countdownMs);
  }

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    lastActivityAtRef.current = Date.now();
    warningStartedAtRef.current = null;
    isWarningRef.current = false;

    function registerActivity() {
      if (isWarningRef.current) {
        return;
      }

      lastActivityAtRef.current = Date.now();
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true });
    });

    const intervalId = setInterval(() => {
      const now = Date.now();

      if (!isWarningRef.current) {
        if (now - lastActivityAtRef.current >= warningDelayMs) {
          isWarningRef.current = true;
          warningStartedAtRef.current = now;

          setIsWarning(true);
          setRemainingMs(countdownMs);
        }

        return;
      }

      const remaining = countdownMs - (now - warningStartedAtRef.current);

      setRemainingMs(Math.max(0, remaining));

      if (remaining <= 0) {
        isWarningRef.current = false;
        warningStartedAtRef.current = null;

        setIsWarning(false);

        onTimeoutRef.current?.();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity);
      });
    };
  }, [enabled, warningDelayMs, countdownMs]);

  return {
    /* Con la vigilancia apagada nunca hay advertencia. */
    isWarning: enabled && isWarning,
    remainingMs,
    extendSession,
  };
}
