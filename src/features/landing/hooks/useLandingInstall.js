import { useSyncExternalStore } from 'react';

import {
  isIosDevice,
  resolveInstallState,
} from '../services/installMode.js';

function isStandalone() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true
  );
}

/**
 * Estado del botón «Instalar» (beforeinstallprompt con fallback para iOS).
 * Recibe el almacén por prop: la landing no importa de otras features, y el
 * evento puede haber llegado antes de montarla (main.jsx lo escucha).
 * @param {{ subscribe: Function, getSnapshot: Function, promptInstall: Function }} store
 */
export function useLandingInstall(store) {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const nav = typeof navigator === 'undefined' ? null : navigator;

  const state = resolveInstallState({
    nativeAvailable: snapshot.disponible,
    installed: snapshot.instalada || isStandalone(),
    ios: isIosDevice(nav?.userAgent, nav?.maxTouchPoints),
  });

  return { state, promptInstall: store.promptInstall };
}
