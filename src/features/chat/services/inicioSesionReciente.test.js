import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  leerInicioSesion,
  olvidarInicioSesion,
  recordarInicioSesion,
} from './inicioSesionReciente.js';

const ID_A = '32000000-0000-4000-8000-00000000000a';
const ID_B = '32000000-0000-4000-8000-00000000000b';
const modelo = (idSesion) => ({ sesion: { idSesion } });

describe('inicioSesionReciente (RF-32)', () => {
  afterEach(() => {
    olvidarInicioSesion(ID_A);
    olvidarInicioSesion(ID_B);
    vi.unstubAllGlobals();
  });

  it('solo entrega los datos del mismo idSesion de la URL', () => {
    const a = modelo(ID_A);
    recordarInicioSesion(a);

    expect(leerInicioSesion(ID_B)).toBeNull();
    expect(leerInicioSesion(ID_A)).toBe(a);
  });

  it('leer no consume (StrictMode); olvidar sí', () => {
    recordarInicioSesion(modelo(ID_A));

    expect(leerInicioSesion(ID_A)).not.toBeNull();
    expect(leerInicioSesion(ID_A)).not.toBeNull();

    olvidarInicioSesion(ID_A);
    expect(leerInicioSesion(ID_A)).toBeNull();
  });

  it('olvidar otra sesión no descarta la vigente', () => {
    recordarInicioSesion(modelo(ID_A));
    olvidarInicioSesion(ID_B);

    expect(leerInicioSesion(ID_A)).not.toBeNull();
  });

  it('un /iniciar nuevo reemplaza al anterior', () => {
    recordarInicioSesion(modelo(ID_A));
    recordarInicioSesion(modelo(ID_B));

    expect(leerInicioSesion(ID_A)).toBeNull();
    expect(leerInicioSesion(ID_B)).not.toBeNull();
  });

  it('caduca a los 5 minutos y entonces la conversación usa los GET', () => {
    recordarInicioSesion(modelo(ID_A), 0);

    expect(leerInicioSesion(ID_A, 5 * 60 * 1000)).not.toBeNull();
    expect(leerInicioSesion(ID_A, 5 * 60 * 1000 + 1)).toBeNull();
    expect(leerInicioSesion(ID_A, 0)).toBeNull();
  });

  it('ignora un modelo sin idSesion', () => {
    recordarInicioSesion(modelo(ID_A));
    recordarInicioSesion({ sesion: {} });

    expect(leerInicioSesion(ID_A)).toBeNull();
  });

  it('no escribe en localStorage ni en sessionStorage', () => {
    const almacen = () => ({
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    });
    const local = almacen();
    const sesion = almacen();
    vi.stubGlobal('localStorage', local);
    vi.stubGlobal('sessionStorage', sesion);

    recordarInicioSesion(modelo(ID_A));
    leerInicioSesion(ID_A);
    olvidarInicioSesion(ID_A);

    for (const fn of [local, sesion].flatMap(Object.values)) {
      expect(fn).not.toHaveBeenCalled();
    }
  });
});
