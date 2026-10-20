import { Download } from 'lucide-react';

import { INSTALL_MODE } from '../../types/installInstructions.js';

// Solo pinta: el modo lo decide useInstallPrompt y los colores, la página.
export function InstallAppButton({ modo, onOpen, className = '' }) {
  if (modo === INSTALL_MODE.INSTALADA) return null;

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onOpen}
      className={`inline-flex min-h-[48px] w-full items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-6)] text-[15px] leading-[1.2] font-bold transition-colors duration-[120ms] motion-reduce:transition-none ${className}`}
    >
      <Download size={20} strokeWidth={1.8} aria-hidden="true" />
      Instalar Brisa
    </button>
  );
}
