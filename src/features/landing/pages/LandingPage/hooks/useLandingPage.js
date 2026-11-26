import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { useLandingInstall } from '../../../hooks/useLandingInstall.js';
import { resolveCtas } from '../../../services/ctas.js';
import { INSTALL_STATE } from '../../../types/landingConfig.js';

/**
 * Estado de la landing: CTA según sesión e instalación, pausa de
 * movimiento, hoja de ayuda para instalar y apertura de la demo.
 */
export function useLandingPage({ isAuthenticated, homePath, installStore }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [demoKey, setDemoKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const install = useLandingInstall(installStore);
  const ctas = resolveCtas({
    isAuthenticated,
    homePath,
    installState: install.state,
  });

  // Scroll suave solo mientras la landing está montada y si la persona no
  // pidió movimiento reducido.
  useEffect(() => {
    if (reduce) return;

    document.documentElement.classList.add('lp-smooth');

    return () => document.documentElement.classList.remove('lp-smooth');
  }, [reduce]);

  // Primera reacción buscada: instalar. Con aviso nativo se lanza directo;
  // en iOS y navegadores sin aviso se abre la hoja con los pasos.
  function requestInstall() {
    if (install.state === INSTALL_STATE.NATIVE) install.promptInstall();
    else setHelpOpen(true);
  }

  // Un aviso abre el chat de la demo desde el principio.
  function openDemo() {
    setDemoKey((value) => value + 1);
    document.getElementById('demo')?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  return {
    ctas,
    install,
    requestInstall,
    helpOpen,
    closeHelp: () => setHelpOpen(false),
    paused: paused || Boolean(reduce),
    reduced: Boolean(reduce),
    togglePaused: () => setPaused((value) => !value),
    demoKey,
    openDemo,
  };
}
