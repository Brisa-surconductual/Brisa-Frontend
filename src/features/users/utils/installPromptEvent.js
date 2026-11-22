// Guarda el evento `beforeinstallprompt` (Chrome, Edge, Opera, Samsung
// Internet) para lanzar el aviso nativo desde «Instalar Brisa» (ADR-0006).
// Safari y Firefox no lo emiten: allí sigue la hoja de instrucciones.
// Recibe `win` por parámetro para probarse sin DOM (ADR-0002).
export function createInstallPromptStore() {
  let state = Object.freeze({ disponible: false, instalada: false });
  let deferredEvent = null;
  let listening = false;
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

    // Debe llamarse al arrancar (main.jsx): el evento puede llegar antes de
    // que se monte la Home.
    listen(win) {
      if (listening || !win?.addEventListener) return;

      listening = true;

      win.addEventListener('beforeinstallprompt', (event) => {
        // Sin esto el navegador muestra su propia barra cuando quiere.
        event.preventDefault();
        deferredEvent = event;
        setState({ disponible: true });
      });

      win.addEventListener('appinstalled', () => {
        deferredEvent = null;
        setState({ disponible: false, instalada: true });
      });
    },

    // El evento solo sirve una vez, acepte o no la persona. Devuelve
    // 'accepted', 'dismissed' o null si no había evento.
    async promptInstall() {
      const event = deferredEvent;

      if (!event) return null;

      deferredEvent = null;
      setState({ disponible: false });
      await event.prompt();

      const choice = await event.userChoice;

      return choice?.outcome ?? null;
    },
  };
}

export const installPromptStore = createInstallPromptStore();

export function listenInstallPrompt(win) {
  installPromptStore.listen(win);
}
