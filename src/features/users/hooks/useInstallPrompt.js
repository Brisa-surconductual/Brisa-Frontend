import { detectPlatform, getInstallMode } from '../utils/installPlatform.js';

// Único punto que cambia en la fase PWA: escuchar `beforeinstallprompt`,
// guardar el evento y devolver el modo 'nativo' con una acción que lo
// dispare. Sin manifest ni service worker ese evento no llega, así que
// hoy no se escucha (decisión D2 del brief FE-M01-HOME).
export function useInstallPrompt() {
  const win = typeof window === 'undefined' ? undefined : window;

  return {
    modo: getInstallMode(win),
    plataforma: detectPlatform(win?.navigator),
  };
}
