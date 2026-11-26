// RF-31: reglas de la carga al desplazarse hacia arriba. Funciones puras
// (el DOM llega por parámetro) para probarlas sin navegador.

// Distancia (px) al inicio del hilo desde la que se pide la página
// anterior, antes de que la estudiante llegue al borde.
export const UMBRAL_CARGA_PX = 200;

const DESPLAZABLE = new Set(['auto', 'scroll', 'overlay']);

/*
 * Contenedor que desplaza el hilo: el ancestro más cercano con scroll
 * vertical propio o, si no hay, el documento (el layout del estudiante
 * desplaza la ventana).
 */
export function contenedorDeScroll(
  elemento,
  {
    estiloDe = (el) => globalThis.getComputedStyle(el),
    documento = globalThis.document,
  } = {},
) {
  for (let el = elemento?.parentElement; el; el = el.parentElement) {
    if (
      DESPLAZABLE.has(estiloDe(el).overflowY) &&
      el.scrollHeight > el.clientHeight
    ) {
      return el;
    }
  }
  return documento?.scrollingElement ?? documento?.documentElement ?? null;
}

// Borde superior visible del contenedor (0 para el documento).
export function bordeSuperior(contenedor, documento = globalThis.document) {
  return contenedor === documento?.scrollingElement ||
    contenedor === documento?.documentElement
    ? 0
    : contenedor.getBoundingClientRect().top;
}

/*
 * Se pide la página anterior solo si la estudiante se desplaza HACIA
 * ARRIBA y el inicio del hilo está a menos de `umbral` del borde visible.
 * Nunca con una carga en curso, sin más páginas o tras un error (el
 * reintento es explícito, con el botón).
 */
export function debeCargarAnteriores({
  subiendo,
  distanciaAlInicio,
  hayMas,
  cargando,
  conError,
  umbral = UMBRAL_CARGA_PX,
}) {
  return (
    subiendo === true &&
    hayMas === true &&
    !cargando &&
    !conError &&
    distanciaAlInicio > -umbral
  );
}

// Cuánto desplazar tras anteponer la página para que lo que se leía
// quede en el mismo sitio: lo que bajó el primer mensaje anterior.
export const ajusteTrasAnteponer = (topAntes, topDespues) =>
  Number.isFinite(topAntes) && Number.isFinite(topDespues)
    ? topDespues - topAntes
    : 0;
