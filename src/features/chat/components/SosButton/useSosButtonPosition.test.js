import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LADO_SOS,
  posicionRecordada,
  recordarPosicion,
} from './posicionSosButton.js';
import { activarDesdeClick } from './abrirSos.js';
import { useSosButtonPosition } from './useSosButtonPosition.js';

/*
 * Vitest corre en `node` (ADR-0002): React se simula con celdas por orden
 * de llamada y el DOM con objetos mínimos (ventana de 360 × 740,
 * encabezado de 64 px y barra inferior desde y = 676).
 */
const react = vi.hoisted(() => {
  const estado = { celdas: [], indice: 0 };
  return {
    estado,
    useRef: (inicial) => {
      const i = estado.indice++;
      if (!(i in estado.celdas)) estado.celdas[i] = { current: inicial };
      return estado.celdas[i];
    },
    useState: (inicial) => {
      const i = estado.indice++;
      if (!(i in estado.celdas)) {
        estado.celdas[i] = {
          valor: typeof inicial === 'function' ? inicial() : inicial,
        };
      }
      const celda = estado.celdas[i];
      return [
        celda.valor,
        (nuevo) => {
          celda.valor =
            typeof nuevo === 'function' ? nuevo(celda.valor) : nuevo;
        },
      ];
    },
    useEffect: () => {},
  };
});

vi.mock('react', () => ({
  useRef: react.useRef,
  useState: react.useState,
  useEffect: react.useEffect,
}));

let rectBoton;
let barraVisible;

function render(hook = useSosButtonPosition) {
  react.estado.indice = 0;
  return hook({ visible: true });
}

function montar() {
  const hook = render();
  hook.botonRef.current = {
    getBoundingClientRect: () => rectBoton,
    setPointerCapture: vi.fn(),
    hasPointerCapture: () => true,
    releasePointerCapture: vi.fn(),
  };
  return hook;
}

const puntero = (clientX, clientY, extra = {}) => ({
  clientX,
  clientY,
  pointerId: 1,
  pointerType: 'touch',
  button: 0,
  preventDefault: vi.fn(),
  ...extra,
});

beforeEach(() => {
  react.estado.celdas = [];
  // Posición inicial por CSS: abajo a la derecha, sobre la barra.
  rectBoton = { left: 104, top: 612, width: 240, height: 48 };
  barraVisible = true;

  vi.stubGlobal('window', { innerHeight: 740, innerWidth: 360 });
  vi.stubGlobal('getComputedStyle', () => ({
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
  }));
  vi.stubGlobal('document', {
    documentElement: { clientWidth: 360 },
    body: { appendChild: () => {} },
    createElement: () => ({ style: {}, remove: () => {} }),
    querySelector: (selector) => {
      if (selector.includes('superior')) {
        return {
          getBoundingClientRect: () => ({ top: 0, bottom: 64, height: 64 }),
        };
      }
      return {
        getBoundingClientRect: () =>
          barraVisible
            ? { top: 676, bottom: 740, height: 64 }
            : { top: 0, bottom: 0, height: 0 },
      };
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  recordarPosicion(null);
});

describe('useSosButtonPosition (RF-43)', () => {
  it('sin mover, el botón usa su posición por CSS', () => {
    expect(montar().estilo).toBeUndefined();
  });

  it('un toque no mueve el botón y su click activa el SOS', () => {
    const hook = montar();
    const activar = vi.fn();

    hook.manejadores.onPointerDown(puntero(200, 630));
    hook.manejadores.onPointerMove(puntero(203, 632));
    hook.manejadores.onPointerUp(puntero(203, 632));

    const despues = render();
    expect(despues.estilo).toBeUndefined();
    expect(
      activarDesdeClick({
        consumirClickDeArrastre: despues.consumirClickDeArrastre,
        candadoRef: { current: false },
        activar,
      }),
    ).toBe(true);
    expect(activar).toHaveBeenCalledTimes(1);
  });

  it('arrastrar mueve el botón, lo ajusta al borde y su click no activa el SOS', () => {
    const hook = montar();
    const activar = vi.fn();
    const movimiento = puntero(120, 400);

    hook.manejadores.onPointerDown(puntero(200, 630));
    hook.manejadores.onPointerMove(movimiento);

    const arrastrando = render();
    expect(movimiento.preventDefault).toHaveBeenCalled();
    expect(arrastrando.arrastrando).toBe(true);
    expect(arrastrando.estilo).toMatchObject({ left: '24px', top: '382px' });

    hook.manejadores.onPointerUp(puntero(120, 400));
    const soltado = render();

    expect(soltado.arrastrando).toBe(false);
    // Más cerca del borde izquierdo: x = margen.
    expect(soltado.estilo).toEqual({
      left: '16px',
      top: '382px',
      right: 'auto',
      bottom: 'auto',
    });
    expect(posicionRecordada()).toEqual({ lado: LADO_SOS.IZQUIERDA, y: 382 });

    const candadoRef = { current: false };
    expect(
      activarDesdeClick({
        consumirClickDeArrastre: soltado.consumirClickDeArrastre,
        candadoRef,
        activar,
      }),
    ).toBe(false);
    expect(activar).not.toHaveBeenCalled();
    // Solo se ignora ese click: el siguiente toque sí activa.
    expect(
      activarDesdeClick({
        consumirClickDeArrastre: soltado.consumirClickDeArrastre,
        candadoRef,
        activar,
      }),
    ).toBe(true);
  });

  it('si tras el arrastre el navegador no envía click, el siguiente toque no queda bloqueado', () => {
    const hook = montar();

    hook.manejadores.onPointerDown(puntero(200, 630));
    hook.manejadores.onPointerMove(puntero(100, 300));
    hook.manejadores.onPointerCancel(puntero(100, 300));
    hook.manejadores.onPointerDown(puntero(30, 300));
    hook.manejadores.onPointerUp(puntero(30, 300));

    expect(render().consumirClickDeArrastre()).toBe(false);
  });

  it('móvil: arrastrado hacia abajo no tapa la barra inferior', () => {
    const hook = montar();

    hook.manejadores.onPointerDown(puntero(200, 630));
    hook.manejadores.onPointerMove(puntero(200, 2000));

    expect(render().estilo.top).toBe(`${676 - 16 - 48}px`);
  });

  it('escritorio (sin barra inferior): puede bajar hasta el margen inferior', () => {
    barraVisible = false;
    const hook = montar();

    hook.manejadores.onPointerDown(puntero(200, 630));
    hook.manejadores.onPointerMove(puntero(200, 2000));

    expect(render().estilo.top).toBe(`${740 - 16 - 48}px`);
  });

  it('con el mouse solo arrastra el botón principal', () => {
    const hook = montar();

    hook.manejadores.onPointerDown(
      puntero(200, 630, { pointerType: 'mouse', button: 2 }),
    );
    hook.manejadores.onPointerMove(puntero(50, 200, { pointerType: 'mouse' }));

    expect(render().arrastrando).toBe(false);
  });

  it('teclado: las flechas lo mueven y Enter no', () => {
    const hook = montar();
    const flecha = { key: 'ArrowLeft', preventDefault: vi.fn() };
    const enter = { key: 'Enter', preventDefault: vi.fn() };

    hook.manejadores.onKeyDown(enter);
    expect(enter.preventDefault).not.toHaveBeenCalled();
    expect(render().estilo).toBeUndefined();

    hook.manejadores.onKeyDown(flecha);
    expect(flecha.preventDefault).toHaveBeenCalled();
    expect(render().estilo).toMatchObject({ left: '16px', top: '612px' });

    hook.manejadores.onKeyDown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(render().estilo.top).toBe('588px');
  });

  it('la posición elegida se conserva al volver a montar el botón (navegación)', () => {
    const hook = montar();

    hook.manejadores.onKeyDown({ key: 'ArrowLeft', preventDefault: () => {} });
    react.estado.celdas = [];

    expect(posicionRecordada()).toEqual({ lado: LADO_SOS.IZQUIERDA, y: 612 });
  });
});

describe('activarDesdeClick: protección contra doble activación', () => {
  it('el segundo click con el candado puesto no activa otra vez', () => {
    const activar = vi.fn();
    const candadoRef = { current: false };
    const sinArrastre = () => false;

    activarDesdeClick({
      consumirClickDeArrastre: sinArrastre,
      candadoRef,
      activar,
    });
    activarDesdeClick({
      consumirClickDeArrastre: sinArrastre,
      candadoRef,
      activar,
    });

    expect(activar).toHaveBeenCalledTimes(1);
  });
});
