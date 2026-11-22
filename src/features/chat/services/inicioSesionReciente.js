/*
 * RF-32: traspaso de la respuesta de /iniciar de la pantalla de entrada a la
 * conversación, para no repetir los GET iniciales del nodo y del historial.
 *
 * Solo en memoria y para una sola sesión: nunca en localStorage,
 * sessionStorage ni en el estado del historial del navegador (sobrevive a
 * F5), porque contiene respuestas del estudiante y URL firmadas. Tras F5 o
 * entrada directa no hay nada y la conversación usa los GET.
 */
const VIGENCIA_MS = 5 * 60 * 1000;

let reciente = null;

export function recordarInicioSesion(modelo, ahora = Date.now()) {
  const idSesion = modelo?.sesion?.idSesion;

  reciente = idSesion ? { idSesion, modelo, guardadoEn: ahora } : null;
}

// Solo devuelve datos del mismo `idSesion` y todavía vigentes. No los
// consume: la lectura ocurre al crear el estado y puede repetirse
// (StrictMode); se descartan con `olvidarInicioSesion`.
export function leerInicioSesion(idSesion, ahora = Date.now()) {
  if (!reciente || reciente.idSesion !== idSesion) return null;

  if (ahora - reciente.guardadoEn > VIGENCIA_MS) {
    reciente = null;
    return null;
  }

  return reciente.modelo;
}

export function olvidarInicioSesion(idSesion) {
  if (reciente?.idSesion === idSesion) reciente = null;
}
