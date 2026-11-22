import { describe, expect, it } from 'vitest';

import { detectPlatform, getInstallMode } from './installPlatform.js';

const UA = Object.freeze({
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile Safari/604.1',
  mac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  firefoxWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) ' +
    'Gecko/20100101 Firefox/143.0',
  firefoxLinux:
    'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
  firefoxMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:143.0) ' +
    'Gecko/20100101 Firefox/143.0',
  operaWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0',
  operaAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 OPR/86.0.0.0',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 ' +
    'Mobile Safari/537.36',
  firefoxAndroid:
    'Mozilla/5.0 (Android 14; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  chromeIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 ' +
    'Mobile/15E148 Safari/604.1',
});

describe('detectPlatform', () => {
  it.each([
    ['iPhone', { userAgent: UA.iphone }, 'ios'],
    [
      'iPad con UA de Mac',
      { userAgent: UA.mac, platform: 'MacIntel', maxTouchPoints: 5 },
      'ios',
    ],
    [
      'Mac sin pantalla táctil',
      { userAgent: UA.mac, platform: 'MacIntel', maxTouchPoints: 0 },
      'desktop',
    ],
    ['Android', { userAgent: UA.android }, 'android'],
    ['Chrome de Windows', { userAgent: UA.chromeWindows }, 'desktop'],
    ['Firefox de Windows', { userAgent: UA.firefoxWindows }, 'desktop'],
    [
      'Firefox de Windows anterior a la 143',
      { userAgent: UA.firefoxWindows.replaceAll('143.0', '120.0') },
      'unsupported',
    ],
    ['Firefox de Linux', { userAgent: UA.firefoxLinux }, 'unsupported'],
    ['Firefox de Mac', { userAgent: UA.firefoxMac }, 'unsupported'],
    ['Safari de Mac (Añadir al Dock)', { userAgent: UA.mac }, 'desktop'],
    ['Edge de Windows', { userAgent: UA.edgeWindows }, 'desktop'],
    ['Opera de Windows', { userAgent: UA.operaWindows }, 'desktop'],
    ['Opera de Android', { userAgent: UA.operaAndroid }, 'android'],
    ['Samsung Internet', { userAgent: UA.samsung }, 'android'],
    ['Firefox de Android', { userAgent: UA.firefoxAndroid }, 'android'],
    ['Chrome de iPhone', { userAgent: UA.chromeIos }, 'ios'],
    ['sin navigator', undefined, 'desktop'],
  ])('%s', (_, nav, expected) => {
    expect(detectPlatform(nav)).toBe(expected);
  });
});

describe('getInstallMode', () => {
  // Simula un navegador en el que solo coincide un display-mode.
  const withMode = (mode, navigator = {}) => ({
    matchMedia: (query) => ({ matches: query === `(display-mode: ${mode})` }),
    navigator,
  });

  it.each(['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay'])(
    'display-mode %s → instalada',
    (mode) => {
      expect(getInstallMode(withMode(mode))).toBe('instalada');
    },
  );

  it('display-mode browser → instrucciones', () => {
    expect(getInstallMode(withMode('browser'))).toBe('instrucciones');
  });

  it('navigator.standalone en iOS → instalada', () => {
    expect(getInstallMode(withMode('browser', { standalone: true }))).toBe(
      'instalada',
    );
  });

  it('con aviso nativo disponible → nativo', () => {
    expect(getInstallMode(withMode('browser'), { disponible: true })).toBe(
      'nativo',
    );
  });

  it('instalada gana sobre el aviso nativo', () => {
    expect(
      getInstallMode(withMode('standalone'), { disponible: true }),
    ).toBe('instalada');
  });

  it('appinstalled en la pestaña del navegador → instalada', () => {
    expect(getInstallMode(withMode('browser'), { instalada: true })).toBe(
      'instalada',
    );
  });

  it('sin matchMedia ni window → instrucciones', () => {
    expect(getInstallMode({ navigator: {} })).toBe('instrucciones');
    expect(getInstallMode({ matchMedia: () => null })).toBe('instrucciones');
    expect(getInstallMode(undefined)).toBe('instrucciones');
  });
});
