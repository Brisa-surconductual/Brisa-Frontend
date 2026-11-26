import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const css = readFileSync(
  fileURLToPath(new URL('../../../../styles/tokens.css', import.meta.url)),
  'utf8',
);
const [claro, oscuro] = css.split('[data-theme="dark"]');

const token = (bloque, nombre) =>
  bloque
    .match(new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`))?.[1]
    ?.toLowerCase();

// WCAG 2.x: luminancia relativa y razón de contraste.
function luminancia(hex) {
  const canal = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe('tokens del botón SOS (RF-43)', () => {
  it('rojo #C62828 con texto blanco', () => {
    expect(token(claro, 'sos-bg')).toBe('#c62828');
    expect(token(claro, 'sos-text')).toBe('#ffffff');
  });

  it.each(['sos-bg', 'sos-bg-hover', 'sos-bg-active'])(
    'texto blanco sobre %s cumple AA (4.5:1)',
    (nombre) => {
      expect(contraste(token(claro, nombre), '#ffffff')).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  it('el anillo de foco contrasta con el fondo (3:1) en tema claro y oscuro', () => {
    const fondoClaro = token(claro, 'neutral-50') ?? '#ffffff';
    const fondoOscuro = '#161510';

    expect(
      contraste(token(claro, 'sos-focus-ring'), fondoClaro),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contraste(token(oscuro, 'sos-focus-ring'), fondoOscuro),
    ).toBeGreaterThanOrEqual(3);
  });

  it('no altera la paleta de los demás botones', () => {
    expect(token(claro, 'danger')).toBe('#c13b30');
    expect(token(claro, 'brand-500')).toBe('#1d8378');
  });
});
