import { describe, expect, it, vi } from 'vitest';

import { createInstallPromptStore } from './installPromptEvent.js';

// Evento falso con la forma de BeforeInstallPromptEvent.
function fakePromptEvent(outcome = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true });

  event.prompt = vi.fn(() => Promise.resolve());
  event.userChoice = Promise.resolve({ outcome });

  return event;
}

describe('createInstallPromptStore', () => {
  it('sin evento no hay aviso disponible y promptInstall devuelve null', async () => {
    const store = createInstallPromptStore();

    store.listen(new EventTarget());

    expect(store.getSnapshot()).toEqual({
      disponible: false,
      instalada: false,
    });
    await expect(store.promptInstall()).resolves.toBeNull();
  });

  it('guarda beforeinstallprompt, evita la barra del navegador y avisa', () => {
    const store = createInstallPromptStore();
    const win = new EventTarget();
    const listener = vi.fn();
    const event = fakePromptEvent();

    store.listen(win);
    store.subscribe(listener);
    win.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(store.getSnapshot().disponible).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('promptInstall abre el aviso una sola vez y devuelve la elección', async () => {
    const store = createInstallPromptStore();
    const win = new EventTarget();
    const event = fakePromptEvent('dismissed');

    store.listen(win);
    win.dispatchEvent(event);

    await expect(store.promptInstall()).resolves.toBe('dismissed');
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().disponible).toBe(false);
    await expect(store.promptInstall()).resolves.toBeNull();
  });

  it('appinstalled marca la app como instalada y descarta el evento', () => {
    const store = createInstallPromptStore();
    const win = new EventTarget();

    store.listen(win);
    win.dispatchEvent(fakePromptEvent());
    win.dispatchEvent(new Event('appinstalled'));

    expect(store.getSnapshot()).toEqual({
      disponible: false,
      instalada: true,
    });
  });

  it('escuchar dos veces no duplica los listeners', () => {
    const store = createInstallPromptStore();
    const win = new EventTarget();
    const listener = vi.fn();

    store.listen(win);
    store.listen(win);
    store.subscribe(listener);
    win.dispatchEvent(fakePromptEvent());

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('tolera que no haya window', () => {
    const store = createInstallPromptStore();

    expect(() => store.listen(undefined)).not.toThrow();
  });
});
