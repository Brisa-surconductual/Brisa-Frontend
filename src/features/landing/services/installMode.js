import { INSTALL_STATE } from '../types/landingConfig.js';

/**
 * iPhone, iPad (también iPadOS que se presenta como Mac táctil).
 * @param {string} userAgent
 * @param {number} maxTouchPoints
 */
export function isIosDevice(userAgent = '', maxTouchPoints = 0) {
  return (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  );
}

/**
 * Decide qué hace el botón «Instalar».
 * @param {{ nativeAvailable: boolean, installed: boolean, ios: boolean }} input
 */
export function resolveInstallState({ nativeAvailable, installed, ios }) {
  if (installed) return INSTALL_STATE.INSTALLED;
  if (nativeAvailable) return INSTALL_STATE.NATIVE;
  if (ios) return INSTALL_STATE.IOS;

  return INSTALL_STATE.OTHER;
}
