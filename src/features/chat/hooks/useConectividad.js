import { useEffect, useState, useSyncExternalStore } from 'react';

import {
  leerNavegadorEnLinea,
  resolverConectividad,
} from '../utils/conectividad.js';

function suscribir(avisar) {
  window.addEventListener('online', avisar);
  window.addEventListener('offline', avisar);

  return () => {
    window.removeEventListener('online', avisar);
    window.removeEventListener('offline', avisar);
  };
}

const leerServidor = () => true;

/*
 * Estado de conectividad (regla 6). `marcarFalloDeRed` lo usa quien
 * detecte una petición caída por red; el siguiente evento `online` lo
 * limpia. `simulada` fuerza SIN_CONEXION (solo la demostración).
 */
export function useConectividad({ simulada = false } = {}) {
  const navegadorEnLinea = useSyncExternalStore(
    suscribir,
    () => leerNavegadorEnLinea(),
    leerServidor,
  );
  const [falloDeRed, setFalloDeRed] = useState(false);

  useEffect(() => {
    const limpiar = () => setFalloDeRed(false);

    window.addEventListener('online', limpiar);
    return () => window.removeEventListener('online', limpiar);
  }, []);

  return {
    conectividad: resolverConectividad({
      navegadorEnLinea,
      falloDeRed,
      simulada,
    }),
    marcarFalloDeRed: () => setFalloDeRed(true),
  };
}
