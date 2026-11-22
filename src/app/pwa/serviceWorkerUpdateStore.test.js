import { describe, expect, it, vi } from 'vitest';

import { createServiceWorkerUpdateStore } from './serviceWorkerUpdateStore.js';

// registerSW falso: guarda las opciones para disparar onNeedRefresh.
function fakeRegisterSW() {
  const updateServiceWorker = vi.fn();
  const registerSW = vi.fn((options) => {
    registerSW.options = options;

    return updateServiceWorker;
  });

  return { registerSW, updateServiceWorker };
}

describe('createServiceWorkerUpdateStore', () => {
  it('empieza sin aviso', () => {
    const store = createServiceWorkerUpdateStore();

    expect(store.getSnapshot()).toEqual({ needRefresh: false });
  });

  it('muestra el aviso cuando hay una versión nueva', () => {
    const store = createServiceWorkerUpdateStore();
    const { registerSW } = fakeRegisterSW();
    const listener = vi.fn();

    store.connect(registerSW);
    store.subscribe(listener);
    registerSW.options.onNeedRefresh();

    expect(store.getSnapshot().needRefresh).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('no recarga hasta que se pide actualizar', () => {
    const store = createServiceWorkerUpdateStore();
    const { registerSW, updateServiceWorker } = fakeRegisterSW();

    store.connect(registerSW);
    registerSW.options.onNeedRefresh();

    expect(updateServiceWorker).not.toHaveBeenCalled();

    store.update();

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
    expect(store.getSnapshot().needRefresh).toBe(false);
  });

  it('«Más tarde» oculta el aviso sin actualizar', () => {
    const store = createServiceWorkerUpdateStore();
    const { registerSW, updateServiceWorker } = fakeRegisterSW();

    store.connect(registerSW);
    registerSW.options.onNeedRefresh();
    store.dismiss();

    expect(store.getSnapshot().needRefresh).toBe(false);
    expect(updateServiceWorker).not.toHaveBeenCalled();
  });

  it('dejar de escuchar quita el listener', () => {
    const store = createServiceWorkerUpdateStore();
    const { registerSW } = fakeRegisterSW();
    const listener = vi.fn();

    store.connect(registerSW);
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    registerSW.options.onNeedRefresh();

    expect(listener).not.toHaveBeenCalled();
  });
});
