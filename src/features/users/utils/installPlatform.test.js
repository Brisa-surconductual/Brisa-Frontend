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
    ['Firefox de Linux', { userAgent: UA.firefoxLinux }, 'unsupported'],
    ['Firefox de Mac', { userAgent: UA.firefoxMac }, 'unsupported'],
    ['sin navigator', undefined, 'desktop'],
  ])('%s', (_, nav, expected) => {
    expect(detectPlatform(nav)).toBe(expected);
  });
});

describe('getInstallMode', () => {
  const withMedia = (matches, navigator = {}) => ({
    matchMedia: () => ({ matches }),
    navigator,
  });

  it('display-mode standalone → instalada', () => {
    expect(getInstallMode(withMedia(true))).toBe('instalada');
  });

  it('navigator.standalone en iOS → instalada', () => {
    expect(getInstallMode(withMedia(false, { standalone: true }))).toBe(
      'instalada',
    );
  });

  it('en el navegador → instrucciones', () => {
    expect(getInstallMode(withMedia(false))).toBe('instrucciones');
  });

  it('sin matchMedia ni window → instrucciones', () => {
    expect(getInstallMode({ navigator: {} })).toBe('instrucciones');
    expect(getInstallMode(undefined)).toBe('instrucciones');
  });
});
