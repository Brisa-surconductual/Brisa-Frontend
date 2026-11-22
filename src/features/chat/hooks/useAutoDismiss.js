import { useEffect } from 'react';

import { AVISO_AUTO_CIERRE_MS } from '../types/avisos.js';

// Llama a `onDismiss` cuando `valor` lleva `ms` visible. Un valor nuevo
// reinicia la cuenta; un valor vacío no programa nada.
export function useAutoDismiss(valor, onDismiss, ms = AVISO_AUTO_CIERRE_MS) {
  useEffect(() => {
    if (!valor) return undefined;
    const temporizador = setTimeout(onDismiss, ms);
    return () => clearTimeout(temporizador);
    // `onDismiss` puede cambiar en cada render; la cuenta depende del aviso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, ms]);
}
