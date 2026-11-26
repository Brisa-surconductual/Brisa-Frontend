import { useSyncExternalStore } from 'react';

import { serviceWorkerUpdateStore } from './serviceWorkerUpdateStore.js';

export function useServiceWorkerUpdate(store = serviceWorkerUpdateStore) {
  const { needRefresh } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  return {
    needRefresh,
    update: store.update,
    dismiss: store.dismiss,
  };
}
