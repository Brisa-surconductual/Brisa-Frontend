import { describe, expect, it } from 'vitest';

import { isIosDevice, resolveInstallState } from './installMode.js';

describe('isIosDevice', () => {
  it('detecta iPhone y iPadOS', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe(true);
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5)).toBe(true);
  });

  it('no confunde Mac de escritorio ni Android', () => {
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 0)).toBe(false);
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14)')).toBe(false);
  });
});

describe('resolveInstallState', () => {
  it('prioriza instalada, luego nativo, luego iOS', () => {
    expect(resolveInstallState({ installed: true, nativeAvailable: true, ios: true })).toBe('installed');
    expect(resolveInstallState({ installed: false, nativeAvailable: true, ios: true })).toBe('native');
    expect(resolveInstallState({ installed: false, nativeAvailable: false, ios: true })).toBe('ios');
    expect(resolveInstallState({ installed: false, nativeAvailable: false, ios: false })).toBe('other');
  });
});
