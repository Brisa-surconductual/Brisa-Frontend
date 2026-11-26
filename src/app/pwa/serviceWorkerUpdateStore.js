// Estado del aviso «hay una nueva versión» (C-PWA-4, ADR-0006).
// Recibe `registerSW` por parámetro para poder probarse sin navegador ni
// el módulo virtual de vite-plugin-pwa.
export function createServiceWorkerUpdateStore() {
  let state = Object.freeze({ needRefresh: false });
  let updateServiceWorker = null;
  const listeners = new Set();

  function setState(next) {
    state = Object.freeze({ ...state, ...next });
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },

    getSnapshot() {
      return state;
    },

    connect(registerSW) {
      updateServiceWorker = registerSW({
        onNeedRefresh() {
          setState({ needRefresh: true });
        },
      });
    },

    // Solo aquí se recarga: nunca en medio de un chat o de un registro.
    update() {
      setState({ needRefresh: false });

      return updateServiceWorker?.(true);
    },

    // La versión nueva queda en espera y se activa al cerrar todas las
    // ventanas de Brisa.
    dismiss() {
      setState({ needRefresh: false });
    },
  };
}

export const serviceWorkerUpdateStore = createServiceWorkerUpdateStore();
