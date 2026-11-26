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
 * detecte una petición caída por red; lo limpian el siguiente evento
 * `online` o `limpiarFalloDeRed` (una respuesta del servidor prueba que
 * hay red). `simulada` fuerza SIN_CONEXION (solo la demostración).
 *
 * `disponible` es la conexión del navegador (o la simulada) sin contar
 * el fallo de red: la sincronización la usa para decidir si intenta.
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
    disponible: navegadorEnLinea && !simulada,
    falloDeRed,
    marcarFalloDeRed: () => setFalloDeRed(true),
    limpiarFalloDeRed: () => setFalloDeRed(false),
  };
}
