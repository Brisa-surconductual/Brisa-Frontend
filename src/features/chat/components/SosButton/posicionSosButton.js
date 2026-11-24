/*
 * RF-43: posición del botón SOS flotante. Funciones puras: el componente
 * mide el DOM y estas deciden. La posición se guarda como borde
 * horizontal (`lado`) más la altura (`y`): así, al cambiar el tamaño u
 * orientación de la pantalla, el botón sigue pegado a su borde y solo se
 * vuelve a limitar la altura.
 */

// Desplazamiento mínimo para que un gesto cuente como arrastre y no como
// toque. 8 px tolera el temblor de un dedo sin frenar un arrastre real.
export const UMBRAL_ARRASTRE_PX = 8;

// Separación mínima con los bordes, el encabezado y la barra inferior.
export const MARGEN_PX = 16;

// Paso de las flechas del teclado (con Mayús, el largo).
export const PASO_TECLADO_PX = 24;
export const PASO_TECLADO_LARGO_PX = 96;

export const LADO_SOS = Object.freeze({
  IZQUIERDA: 'IZQUIERDA',
  DERECHA: 'DERECHA',
});

const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);

/*
 * Rectángulo en el que puede quedar la esquina superior izquierda del
 * botón. `superior`: borde inferior del encabezado; `inferior`: borde
 * superior de la barra inferior móvil (o el fondo de la pantalla menos el
 * área segura). `seguras`: áreas seguras laterales del dispositivo.
 */
export function calcularLimites({
  anchoVentana,
  altoVentana,
  anchoBoton,
  altoBoton,
  superior = 0,
  inferior = altoVentana,
  seguras = { izquierda: 0, derecha: 0 },
  margen = MARGEN_PX,
}) {
  const minX = seguras.izquierda + margen;
  const minY = superior + margen;

  return Object.freeze({
    minX,
    // En una pantalla más angosta que el botón, se queda en el mínimo.
    maxX: Math.max(minX, anchoVentana - seguras.derecha - margen - anchoBoton),
    minY,
    maxY: Math.max(minY, inferior - margen - altoBoton),
  });
}

export const limitarPunto = ({ x, y }, limites) =>
  Object.freeze({
    x: limitar(x, limites.minX, limites.maxX),
    y: limitar(y, limites.minY, limites.maxY),
  });

// Al soltar: al borde horizontal más cercano, sin salir de los límites.
export function ajustarABorde(punto, limites) {
  const { x, y } = limitarPunto(punto, limites);
  const lado =
    x - limites.minX <= limites.maxX - x
      ? LADO_SOS.IZQUIERDA
      : LADO_SOS.DERECHA;

  return Object.freeze({ lado, y });
}

export function aCoordenadas(posicion, limites) {
  return Object.freeze({
    x: posicion.lado === LADO_SOS.IZQUIERDA ? limites.minX : limites.maxX,
    y: limitar(posicion.y, limites.minY, limites.maxY),
  });
}

/* ---- Gesto de arrastre (Pointer Events) ---- */

export function iniciarGesto({ clientX, clientY }, origen) {
  return Object.freeze({
    inicio: Object.freeze({ x: clientX, y: clientY }),
    origen: Object.freeze({ x: origen.x, y: origen.y }),
    arrastrando: false,
    punto: null,
  });
}

// Hasta superar el umbral el gesto es un toque y el botón no se mueve.
export function moverGesto(gesto, { clientX, clientY }, limites) {
  const dx = clientX - gesto.inicio.x;
  const dy = clientY - gesto.inicio.y;
  const arrastrando =
    gesto.arrastrando || Math.hypot(dx, dy) >= UMBRAL_ARRASTRE_PX;

  return Object.freeze({
    ...gesto,
    arrastrando,
    punto: arrastrando
      ? limitarPunto(
          { x: gesto.origen.x + dx, y: gesto.origen.y + dy },
          limites,
        )
      : null,
  });
}

/*
 * Fin del gesto. Tras un arrastre se ajusta al borde y se suprime el
 * `click` que el navegador puede disparar a continuación; un toque no
 * cambia la posición y deja pasar el `click` (que activa el SOS).
 */
export function terminarGesto(gesto, limites) {
  if (!gesto?.arrastrando || !gesto.punto) {
    return Object.freeze({ posicion: null, suprimirClick: false });
  }

  return Object.freeze({
    posicion: ajustarABorde(gesto.punto, limites),
    suprimirClick: true,
  });
}

/* ---- Teclado ---- */

/*
 * Flechas: izquierda/derecha cambian de borde; arriba/abajo mueven la
 * altura (con Mayús, un paso largo). Enter y Espacio no se tocan: siguen
 * activando el SOS. Devuelve null si la tecla no mueve el botón.
 */
export function moverConTeclado(posicion, { key, shiftKey = false }, limites) {
  const paso = shiftKey ? PASO_TECLADO_LARGO_PX : PASO_TECLADO_PX;
  const y = posicion.y;

  switch (key) {
    case 'ArrowLeft':
      return Object.freeze({ lado: LADO_SOS.IZQUIERDA, y });
    case 'ArrowRight':
      return Object.freeze({ lado: LADO_SOS.DERECHA, y });
    case 'ArrowUp':
      return Object.freeze({
        lado: posicion.lado,
        y: limitar(y - paso, limites.minY, limites.maxY),
      });
    case 'ArrowDown':
      return Object.freeze({
        lado: posicion.lado,
        y: limitar(y + paso, limites.minY, limites.maxY),
      });
    default:
      return null;
  }
}

/* ---- Memoria de la posición ---- */

// Se conserva mientras el estudiante navega por la aplicación (también si
// el layout se vuelve a montar). Solo en memoria: no es un dato que deba
// sobrevivir al cierre de la pestaña.
let recordada = null;

export const posicionRecordada = () => recordada;

export function recordarPosicion(posicion) {
  recordada = posicion
    ? Object.freeze({ lado: posicion.lado, y: posicion.y })
    : null;
}
