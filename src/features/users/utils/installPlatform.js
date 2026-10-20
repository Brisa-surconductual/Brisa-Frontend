import { INSTALL_MODE, INSTALL_PLATFORM } from '../types/installInstructions.js';

// Recibe un objeto con la forma de `navigator` para poder probarla sin DOM.
// La detección falla en casos reales; por eso la hoja deja cambiarla.
export function detectPlatform(nav = {}) {
  const ua = nav.userAgent ?? '';

  if (/iPhone|iPad|iPod/.test(ua)) return INSTALL_PLATFORM.IOS;

  // iPadOS 13+ se identifica como Mac; se distingue por la pantalla táctil.
  // `platform` está obsoleto, pero es la única pista disponible.
  if (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1) {
    return INSTALL_PLATFORM.IOS;
  }

  if (/Android/.test(ua)) return INSTALL_PLATFORM.ANDROID;

  // Firefox de escritorio solo instala sitios en Windows desde la 143.
  const firefox = ua.match(/Firefox\/(\d+)/);

  if (firefox && !(/Windows/.test(ua) && Number(firefox[1]) >= 143)) {
    return INSTALL_PLATFORM.UNSUPPORTED;
  }

  return INSTALL_PLATFORM.DESKTOP;
}

// Cualquier modo distinto de `browser` es una ventana propia. Sin manifest,
// Chromium y Firefox abren la app instalada en minimal-ui (D19).
const INSTALLED_DISPLAY_MODES = Object.freeze([
  'standalone',
  'minimal-ui',
  'fullscreen',
  'window-controls-overlay',
]);

// 'instalada' si la app se abrió desde la pantalla de inicio o en su propia
// ventana. Tolera que falten `window` o `matchMedia` (pruebas, navegadores
// antiguos).
export function getInstallMode(win) {
  const installed =
    INSTALLED_DISPLAY_MODES.some(
      (mode) => win?.matchMedia?.(`(display-mode: ${mode})`)?.matches === true,
    ) || win?.navigator?.standalone === true;

  return installed ? INSTALL_MODE.INSTALADA : INSTALL_MODE.INSTRUCCIONES;
}
