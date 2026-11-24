import { afterEach, describe, expect, it } from 'vitest';

import {
  LADO_SOS,
  MARGEN_PX,
  PASO_TECLADO_LARGO_PX,
  PASO_TECLADO_PX,
  UMBRAL_ARRASTRE_PX,
  aCoordenadas,
  ajustarABorde,
  calcularLimites,
  iniciarGesto,
  moverConTeclado,
  moverGesto,
  posicionRecordada,
  recordarPosicion,
  terminarGesto,
} from './posicionSosButton.js';

// Móvil de referencia: 360 × 740, encabezado de 64 px y barra inferior de
// 64 px; botón de 240 × 48.
const MOVIL = calcularLimites({
  anchoVentana: 360,
  altoVentana: 740,
  anchoBoton: 240,
  altoBoton: 48,
  superior: 64,
  inferior: 676,
});

// Escritorio: sin barra inferior.
const ESCRITORIO = calcularLimites({
  anchoVentana: 1280,
  altoVentana: 800,
  anchoBoton: 240,
  altoBoton: 48,
  superior: 72,
});

const gestoDesde = (x, y) =>
  iniciarGesto({ clientX: x, clientY: y }, { x: 104, y: 600 });

afterEach(() => recordarPosicion(null));

describe('límites del botón SOS', () => {
  it('móvil: respeta encabezado, barra inferior y márgenes', () => {
    expect(MOVIL).toEqual({
      minX: MARGEN_PX,
      maxX: 360 - MARGEN_PX - 240,
      minY: 64 + MARGEN_PX,
      maxY: 676 - MARGEN_PX - 48,
    });
  });

  it('escritorio: sin barra inferior llega hasta el fondo menos el margen', () => {
    expect(ESCRITORIO.maxY).toBe(800 - MARGEN_PX - 48);
    expect(ESCRITORIO.maxX).toBe(1280 - MARGEN_PX - 240);
  });

  it('respeta las áreas seguras laterales (muesca en horizontal)', () => {
    const l = calcularLimites({
      anchoVentana: 800,
      altoVentana: 360,
      anchoBoton: 240,
      altoBoton: 48,
      seguras: { izquierda: 44, derecha: 44 },
    });

    expect(l.minX).toBe(44 + MARGEN_PX);
    expect(l.maxX).toBe(800 - 44 - MARGEN_PX - 240);
  });

  it('pantalla más pequeña que el botón: nunca límites invertidos', () => {
    const l = calcularLimites({
      anchoVentana: 200,
      altoVentana: 100,
      anchoBoton: 240,
      altoBoton: 48,
      superior: 64,
    });

    expect(l.maxX).toBe(l.minX);
    expect(l.maxY).toBe(l.minY);
  });
});

describe('gesto: toque o arrastre', () => {
  it(`por debajo de ${UMBRAL_ARRASTRE_PX} px es un toque: no mueve y no suprime el click`, () => {
    const gesto = moverGesto(
      gestoDesde(200, 620),
      { clientX: 205, clientY: 624 },
      MOVIL,
    );

    expect(gesto.arrastrando).toBe(false);
    expect(gesto.punto).toBeNull();
    expect(terminarGesto(gesto, MOVIL)).toEqual({
      posicion: null,
      suprimirClick: false,
    });
  });

  it('al superar el umbral se arrastra y el botón sigue al puntero', () => {
    const gesto = moverGesto(
      gestoDesde(200, 620),
      { clientX: 180, clientY: 500 },
      MOVIL,
    );

    expect(gesto.arrastrando).toBe(true);
    expect(gesto.punto).toEqual({ x: 84, y: 480 });
  });

  it('una vez arrastrando, volver cerca del inicio sigue siendo arrastre', () => {
    let gesto = moverGesto(
      gestoDesde(200, 620),
      { clientX: 150, clientY: 620 },
      MOVIL,
    );
    gesto = moverGesto(gesto, { clientX: 201, clientY: 620 }, MOVIL);

    expect(gesto.arrastrando).toBe(true);
    expect(terminarGesto(gesto, MOVIL).suprimirClick).toBe(true);
  });

  it('nunca sale del área visible ni tapa el encabezado o la barra inferior', () => {
    const arriba = moverGesto(
      gestoDesde(200, 620),
      { clientX: -500, clientY: -500 },
      MOVIL,
    );
    const abajo = moverGesto(
      gestoDesde(200, 620),
      { clientX: 2000, clientY: 2000 },
      MOVIL,
    );

    expect(arriba.punto).toEqual({ x: MOVIL.minX, y: MOVIL.minY });
    expect(abajo.punto).toEqual({ x: MOVIL.maxX, y: MOVIL.maxY });
  });

  it('al soltar se ajusta al borde horizontal más cercano', () => {
    const haciaIzquierda = moverGesto(
      gestoDesde(200, 620),
      { clientX: 140, clientY: 400 },
      MOVIL,
    );
    const haciaDerecha = moverGesto(
      gestoDesde(200, 620),
      { clientX: 190, clientY: 400 },
      MOVIL,
    );

    expect(terminarGesto(haciaIzquierda, MOVIL)).toEqual({
      posicion: { lado: LADO_SOS.IZQUIERDA, y: 380 },
      suprimirClick: true,
    });
    expect(terminarGesto(haciaDerecha, MOVIL).posicion.lado).toBe(
      LADO_SOS.DERECHA,
    );
  });

  it('terminar sin gesto (cancelado) no hace nada', () => {
    expect(terminarGesto(null, MOVIL)).toEqual({
      posicion: null,
      suprimirClick: false,
    });
  });
});

describe('posición por borde', () => {
  it('se pinta en el borde elegido y con la altura limitada', () => {
    expect(aCoordenadas({ lado: LADO_SOS.IZQUIERDA, y: 300 }, MOVIL)).toEqual({
      x: 16,
      y: 300,
    });
    expect(aCoordenadas({ lado: LADO_SOS.DERECHA, y: 5000 }, MOVIL)).toEqual({
      x: MOVIL.maxX,
      y: MOVIL.maxY,
    });
  });

  it('al girar la pantalla o cambiar el tamaño sigue en su borde y dentro de los límites', () => {
    const posicion = ajustarABorde({ x: 1000, y: 700 }, ESCRITORIO);
    const girado = calcularLimites({
      anchoVentana: 740,
      altoVentana: 360,
      anchoBoton: 240,
      altoBoton: 48,
      superior: 64,
      inferior: 296,
    });

    expect(posicion.lado).toBe(LADO_SOS.DERECHA);
    expect(aCoordenadas(posicion, girado)).toEqual({
      x: girado.maxX,
      y: girado.maxY,
    });
  });
});

describe('teclado', () => {
  const inicio = { lado: LADO_SOS.DERECHA, y: 400 };

  it('flechas izquierda y derecha cambian de borde', () => {
    expect(moverConTeclado(inicio, { key: 'ArrowLeft' }, MOVIL)).toEqual({
      lado: LADO_SOS.IZQUIERDA,
      y: 400,
    });
    expect(
      moverConTeclado(
        { ...inicio, lado: LADO_SOS.IZQUIERDA },
        { key: 'ArrowRight' },
        MOVIL,
      ).lado,
    ).toBe(LADO_SOS.DERECHA);
  });

  it('arriba y abajo mueven la altura; con Mayús, el paso largo', () => {
    expect(moverConTeclado(inicio, { key: 'ArrowUp' }, MOVIL).y).toBe(
      400 - PASO_TECLADO_PX,
    );
    expect(
      moverConTeclado(inicio, { key: 'ArrowDown', shiftKey: true }, MOVIL).y,
    ).toBe(400 + PASO_TECLADO_LARGO_PX);
  });

  it('con el teclado tampoco sale de los límites', () => {
    expect(
      moverConTeclado({ ...inicio, y: MOVIL.minY }, { key: 'ArrowUp' }, MOVIL)
        .y,
    ).toBe(MOVIL.minY);
    expect(
      moverConTeclado(
        { ...inicio, y: MOVIL.maxY },
        { key: 'ArrowDown', shiftKey: true },
        MOVIL,
      ).y,
    ).toBe(MOVIL.maxY);
  });

  it.each(['Enter', ' ', 'Tab', 'Escape'])(
    '%j no mueve el botón (Enter y Espacio activan)',
    (key) => {
      expect(moverConTeclado(inicio, { key }, MOVIL)).toBeNull();
    },
  );
});

describe('memoria de la posición durante la navegación', () => {
  it('se conserva entre lecturas y se puede reiniciar', () => {
    expect(posicionRecordada()).toBeNull();

    recordarPosicion({ lado: LADO_SOS.IZQUIERDA, y: 200, extra: 'x' });
    expect(posicionRecordada()).toEqual({ lado: LADO_SOS.IZQUIERDA, y: 200 });

    recordarPosicion(null);
    expect(posicionRecordada()).toBeNull();
  });
});
