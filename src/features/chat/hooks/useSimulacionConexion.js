import { useSyncExternalStore } from 'react';

/*
 * Solo demostración: «Simular falta de conexión», compartido entre las
 * pantallas de la demostración para que el simulador y el indicador vean
 * lo mismo al navegar. Se pierde al recargar (empieza con conexión).
 */
let simulada = false;
const oyentes = new Set();

function suscribir(avisar) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

export function alternarSimulacionConexion() {
  simulada = !simulada;
  oyentes.forEach((avisar) => avisar());
}

export function useSimulacionConexion() {
  return useSyncExternalStore(
    suscribir,
    () => simulada,
    () => false,
  );
}
