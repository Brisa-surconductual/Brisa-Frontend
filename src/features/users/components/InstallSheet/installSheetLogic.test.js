import { describe, expect, it } from 'vitest';

import {
  getInitialTab,
  getIntro,
  getSheetView,
  getTrapTarget,
  isDetected,
} from './installSheetLogic.js';

describe('getTrapTarget', () => {
  const focusables = ['tab', 'medio', 'entendido'];
  const trap = (active, shiftKey = false) =>
    getTrapTarget({ focusables, active, shiftKey });

  it('Tab en el último vuelve al primero', () => {
    expect(trap('entendido')).toBe('tab');
  });

  it('Shift+Tab en el primero va al último', () => {
    expect(trap('tab', true)).toBe('entendido');
  });

  it('Shift+Tab desde el título (fuera de la lista) va al último', () => {
    expect(trap('titulo', true)).toBe('entendido');
  });

  it('en uno del medio deja el Tab nativo', () => {
    expect(trap('medio')).toBeNull();
    expect(trap('medio', true)).toBeNull();
    expect(trap('titulo')).toBeNull();
  });

  it('sin elementos enfocables devuelve null', () => {
    expect(getTrapTarget({ focusables: [], active: null, shiftKey: false }))
      .toBeNull();
  });
});

it('con navegador no compatible abre sin pestaña y en «No compatible»', () => {
  expect(getInitialTab('unsupported')).toBeNull();
  expect(getSheetView(null)).toBe('unsupported');
  expect(getInitialTab('ios')).toBe('ios');
});

it('la intro propia reemplaza a la general', () => {
  expect(getIntro('desktop')).toMatch(/en su propia ventana/);
  expect(getIntro('unsupported')).toMatch(/no permite agregar/);
  expect(getIntro('android')).toMatch(/como cualquier otra app/);
});

it('isDetected solo con la pestaña de la plataforma detectada', () => {
  expect(isDetected('ios', 'ios')).toBe(true);
  expect(isDetected('android', 'ios')).toBe(false);
  expect(isDetected(null, 'unsupported')).toBe(false);
});
