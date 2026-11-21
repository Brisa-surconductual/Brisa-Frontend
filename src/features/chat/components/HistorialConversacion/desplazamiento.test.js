import { describe, expect, it } from 'vitest';

import {
  UMBRAL_CARGA_PX,
  ajusteTrasAnteponer,
  bordeSuperior,
  contenedorDeScroll,
  debeCargarAnteriores,
} from './desplazamiento.js';

const base = {
  subiendo: true,
  distanciaAlInicio: -50,
  hayMas: true,
  cargando: false,
  conError: false,
};

describe('carga al desplazarse hacia arriba (RF-31)', () => {
  it('pide la página anterior al subir cerca del inicio', () => {
    expect(debeCargarAnteriores(base)).toBe(true);
    expect(debeCargarAnteriores({ ...base, distanciaAlInicio: 30 })).toBe(true);
  });

  it.each([
    ['bajando', { subiendo: false }],
    ['lejos del inicio', { distanciaAlInicio: -UMBRAL_CARGA_PX - 1 }],
    ['sin más páginas', { hayMas: false }],
    ['con una carga en curso', { cargando: true }],
    ['tras un error (el reintento es con el botón)', { conError: true }],
  ])('no la pide %s', (_caso, cambios) => {
    expect(debeCargarAnteriores({ ...base, ...cambios })).toBe(false);
  });

  it('compensa lo que bajó el primer mensaje para no saltar', () => {
    expect(ajusteTrasAnteponer(100, 940)).toBe(840);
    expect(ajusteTrasAnteponer(100, 100)).toBe(0);
    expect(ajusteTrasAnteponer(undefined, 10)).toBe(0);
  });
});

describe('contenedor de scroll', () => {
  const documento = { scrollingElement: { soy: 'documento' } };
  const nodo = (
    overflowY,
    scrollHeight,
    clientHeight,
    parentElement = null,
  ) => ({
    estilo: { overflowY },
    scrollHeight,
    clientHeight,
    parentElement,
  });
  const estiloDe = (el) => el.estilo;

  it('usa el ancestro con scroll vertical propio', () => {
    const panel = nodo('auto', 900, 400);
    const intermedio = nodo('visible', 900, 900, panel);
    const hilo = nodo('visible', 0, 0, intermedio);

    expect(contenedorDeScroll(hilo, { estiloDe, documento })).toBe(panel);
  });

  it('sin ancestro desplazable usa el documento', () => {
    const lleno = nodo('auto', 300, 300);
    const hilo = nodo('visible', 0, 0, lleno);

    expect(contenedorDeScroll(hilo, { estiloDe, documento })).toBe(
      documento.scrollingElement,
    );
  });

  it('el borde del documento es 0; el de un panel, su posición', () => {
    const panel = { getBoundingClientRect: () => ({ top: 64 }) };

    expect(bordeSuperior(documento.scrollingElement, documento)).toBe(0);
    expect(bordeSuperior(panel, documento)).toBe(64);
  });
});
