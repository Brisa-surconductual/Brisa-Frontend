import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { ABOUT } from '../../../../data/landing.content.js';
import { INSTALL_STATE } from '../../../../types/landingConfig.js';

/**
 * Hoja con los pasos para instalar cuando el navegador no ofrece el aviso
 * nativo (iPhone, iPad y otros). Mueve el foco al abrirse, se cierra con
 * Escape y lo devuelve a quien la abrió.
 */
export function InstallSheet({ open, installState, onClose }) {
  const sheetRef = useRef(null);
  const returnRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    returnRef.current = document.activeElement;
    sheetRef.current?.focus();

    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      returnRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const text = ABOUT.install;
  const isIos = installState === INSTALL_STATE.IOS;

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-labelledby="lp-install-title"
      tabIndex={-1}
      className="lp-sheet lp-glass"
    >
      <div className="lp-sheet__head">
        <h2 id="lp-install-title">{isIos ? text.iosTitle : text.otherTitle}</h2>
        <button
          type="button"
          className="lp-sheet__close"
          onClick={onClose}
          aria-label={text.close}
        >
          <X
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>
      </div>
      {isIos ? (
        <ol>
          {text.iosSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : (
        <p>{text.otherHelp}</p>
      )}
    </div>
  );
}
