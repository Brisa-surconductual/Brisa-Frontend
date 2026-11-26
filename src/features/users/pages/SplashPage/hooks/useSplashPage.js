import { useEffect, useRef, useState } from 'react';

import { useInstallPrompt } from '../../../hooks/useInstallPrompt.js';
import { INSTALL_MODE } from '../../../types/installInstructions.js';
import { formatAppFooter } from '../utils/appVersion.js';

export function useSplashPage() {
  const install = useInstallPrompt();
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const installTriggerRef = useRef(null);

  // Al cerrar, el foco vuelve al botón. Se guarda el botón en el clic porque
  // Safari no le da foco al hacer clic, y el efecto corre cuando el resto de
  // la página ya dejó de estar `inert`.
  useEffect(() => {
    if (!isInstallOpen) installTriggerRef.current?.focus();
  }, [isInstallOpen]);

  // Con aviso nativo se instala directo; si la persona lo rechaza, el aviso
  // ya no vuelve y el botón pasa a abrir la hoja de instrucciones.
  function openInstall(event) {
    if (install.modo === INSTALL_MODE.NATIVO) {
      void install.instalar();
      return;
    }

    installTriggerRef.current = event.currentTarget;
    setIsInstallOpen(true);
  }

  function closeInstall() {
    setIsInstallOpen(false);
  }

  return {
    install,
    isInstallOpen,
    openInstall,
    closeInstall,
    footer: formatAppFooter(),
  };
}
