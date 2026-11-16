/*
 * Puerta de la demostración sin conexión. La condición es literal para
 * que Vite elimine la demostración del build de producción: sin modo
 * desarrollo no se carga nada aunque exista la variable.
 */
export function esDemoOfflineHabilitada() {
  return (
    import.meta.env.DEV && import.meta.env.VITE_CHAT_OFFLINE_DEMO === 'true'
  );
}

export async function cargarDemoOffline() {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_CHAT_OFFLINE_DEMO === 'true'
  ) {
    return import('./prepararDemoOffline.js');
  }

  return null;
}

// Simulador de la sincronización (tarea 4). Misma puerta literal: en
// producción no se carga y no hay transporte, así que nada se sincroniza.
export async function cargarDemoSincronizacion() {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_CHAT_OFFLINE_DEMO === 'true'
  ) {
    return import('./simuladorSincronizacion.js');
  }

  return null;
}
