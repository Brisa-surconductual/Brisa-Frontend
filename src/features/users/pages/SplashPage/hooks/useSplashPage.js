import { useState } from 'react';

import { useInstallPrompt } from '../../../hooks/useInstallPrompt.js';
import { formatAppFooter } from '../utils/appVersion.js';

export function useSplashPage() {
  const install = useInstallPrompt();
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  function openInstall() {
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
