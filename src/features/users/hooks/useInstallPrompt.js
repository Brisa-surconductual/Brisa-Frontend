import { useSyncExternalStore } from 'react';

import { installPromptStore } from '../utils/installPromptEvent.js';
import { detectPlatform, getInstallMode } from '../utils/installPlatform.js';

// Decide el modo del botón «Instalar Brisa» (ADR-0001, ADR-0006):
// - 'nativo': el navegador entregó su aviso (Chrome, Edge, Opera, Samsung);
//   `instalar()` lo abre.
// - 'instrucciones': Safari, Firefox o aviso ya usado; se abre la hoja.
// - 'instalada': no se muestra el botón.
export function useInstallPrompt(store = installPromptStore) {
  const win = typeof window === 'undefined' ? undefined : window;
  const prompt = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  return {
    modo: getInstallMode(win, prompt),
    plataforma: detectPlatform(win?.navigator),
    instalar: store.promptInstall,
  };
}
