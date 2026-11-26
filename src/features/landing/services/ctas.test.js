import { describe, expect, it } from 'vitest';

import { resolveCtas } from './ctas.js';

describe('resolveCtas', () => {
  it('en el navegador: el CTA principal es instalar (acción, no ruta)', () => {
    const ctas = resolveCtas({
      isAuthenticated: false,
      homePath: '/x',
      installState: 'other',
    });

    expect(ctas.primary).toEqual({
      label: 'Instalar en tu celular',
      action: 'install',
    });
    expect(ctas.login).toEqual({ label: 'Ya tengo cuenta', to: '/login' });
    expect(ctas.register).toEqual({
      label: 'Crear cuenta',
      to: '/registro/cuenta',
    });
  });

  it('con la app ya instalada: crear cuenta pasa a ser el principal', () => {
    const ctas = resolveCtas({
      isAuthenticated: false,
      homePath: '/x',
      installState: 'installed',
    });

    expect(ctas.primary).toEqual({
      label: 'Crear cuenta',
      to: '/registro/cuenta',
    });
    expect(ctas.register).toBeNull();
  });

  it('con sesión: solo «Ir a mi espacio»', () => {
    const ctas = resolveCtas({
      isAuthenticated: true,
      homePath: '/app/estudiante',
      installState: 'other',
    });

    expect(ctas.primary).toEqual({
      label: 'Ir a mi espacio',
      to: '/app/estudiante',
    });
    expect(ctas.login).toBeNull();
    expect(ctas.register).toBeNull();
  });
});
