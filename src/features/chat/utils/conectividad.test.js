import { describe, expect, it } from 'vitest';

import { leerNavegadorEnLinea, resolverConectividad } from './conectividad.js';

describe('conectividad (regla 6)', () => {
  it.each([
    [{ navegadorEnLinea: true }, 'EN_LINEA'],
    [{ navegadorEnLinea: false }, 'SIN_CONEXION'],
    // Un fallo de red manda aunque el navegador diga que hay conexión.
    [{ navegadorEnLinea: true, falloDeRed: true }, 'SIN_CONEXION'],
    [{ navegadorEnLinea: true, simulada: true }, 'SIN_CONEXION'],
  ])('%o → %s', (entrada, esperado) => {
    expect(resolverConectividad(entrada)).toBe(esperado);
  });

  it('lee navigator.onLine y, sin él, supone conexión', () => {
    expect(leerNavegadorEnLinea({ onLine: false })).toBe(false);
    expect(leerNavegadorEnLinea({})).toBe(true);
  });
});
