import { CTA } from '../data/landing.content.js';
import { INSTALL_STATE, LANDING_ROUTES } from '../types/landingConfig.js';

/**
 * Decide los llamados a la acción según la sesión y la instalación.
 *
 * La primera reacción que se busca es instalar la app en el celular:
 * - Con sesión activa: solo «Ir a mi espacio».
 * - App ya instalada (se abre desde el ícono): «Crear cuenta» e «Ya tengo
 *   cuenta», porque instalar ya no tiene sentido.
 * - En el navegador: CTA principal «Instalar en tu celular» (acción, no
 *   ruta), «Ya tengo cuenta» y un enlace discreto «Crear cuenta» para quien
 *   no pueda instalar. Las rutas son las reales.
 *
 * @param {{ isAuthenticated: boolean, homePath: string, installState?: string }} input
 * @returns {{
 *   primary: { label: string, to?: string, action?: 'install' },
 *   login: { label: string, to: string } | null,
 *   register: { label: string, to: string } | null,
 * }}
 */
export function resolveCtas({ isAuthenticated, homePath, installState }) {
  if (isAuthenticated) {
    return {
      primary: { label: CTA.goToSpace, to: homePath },
      login: null,
      register: null,
    };
  }

  const login = { label: CTA.login, to: LANDING_ROUTES.LOGIN };
  const register = { label: CTA.register, to: LANDING_ROUTES.REGISTER };

  if (installState === INSTALL_STATE.INSTALLED) {
    return { primary: register, login, register: null };
  }

  return {
    primary: { label: CTA.install, action: 'install' },
    login,
    register,
  };
}
