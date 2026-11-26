import { registerSW } from 'virtual:pwa-register';

import { serviceWorkerUpdateStore } from './serviceWorkerUpdateStore.js';

// Se llama solo en producción desde main.jsx (ADR-0006).
export function registerServiceWorker() {
  serviceWorkerUpdateStore.connect(registerSW);
}
