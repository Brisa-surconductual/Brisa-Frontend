import {
  INSTALL_INSTRUCTIONS,
  INSTALL_PLATFORM,
  INSTALL_SHEET_TEXT,
} from '../../types/installInstructions.js';

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Respaldo de la trampa de foco (el resto de la página ya está `inert`):
// devuelve el elemento al que mover el foco, o null para dejar el Tab nativo.
export function getTrapTarget({ focusables, active, shiftKey }) {
  if (focusables.length === 0) return null;

  const index = focusables.indexOf(active);

  if (shiftKey) return index <= 0 ? focusables.at(-1) : null;

  return index === focusables.length - 1 ? focusables[0] : null;
}

// Con navegador no compatible no se marca ninguna pestaña.
export function getInitialTab(platform) {
  return platform === INSTALL_PLATFORM.UNSUPPORTED ? null : platform;
}

export function getSheetView(tab) {
  return tab ?? INSTALL_PLATFORM.UNSUPPORTED;
}

// La intro propia de la plataforma reemplaza a la general.
export function getIntro(view) {
  return INSTALL_INSTRUCTIONS[view].intro ?? INSTALL_SHEET_TEXT.intro;
}

export function isDetected(tab, platform) {
  return tab !== null && tab === platform;
}
