import { TIPO_ENTRADA } from '../types/tipoEntrada.js';

import { mapNodoActual } from './nodoActual.js';

// El historial (contrato RF-31/32) no trae la `entrada` del nodo: el
// texto de la burbuja se arma con el registro y sin configuración (Sí/No,
// número con coma, fecha con el formato por defecto…).
const ENTRADA_SIN_CONFIGURACION = Object.freeze({
  opciones: null,
  min: null,
  max: null,
  formato: null,
});

const esTextoUtil = (valor) => typeof valor === 'string' && valor !== '';

function textoRespuesta(respuesta, entrada, textoDe) {
  // `etiqueta` llega para OPCION_UNICA cuando el árbol la configuró.
  if (esTextoUtil(respuesta.etiqueta)) return respuesta.etiqueta;

  const { tipo_entrada: tipo, valor } = respuesta;
  let texto = null;

  try {
    texto = textoDe(entrada ?? ENTRADA_SIN_CONFIGURACION, tipo, valor);
  } catch {
    // Un valor que no encaja con su tipo se muestra tal cual.
  }

  if (esTextoUtil(texto)) return texto;
  return Array.isArray(valor) ? valor.join(', ') : String(valor);
}

// Nodo del historial (`id_nodo`, `tipo_nodo`, `bloques` del RF-26) al
// modelo de la interfaz. Los bloques no se modifican (RF-26).
const nodoDeHistorial = (nodo) =>
  mapNodoActual({
    nodo: {
      idNodo: nodo?.id_nodo ?? nodo?.idNodo,
      tipoNodo: nodo?.tipo_nodo ?? nodo?.tipoNodo,
      bloques: nodo?.bloques,
      entrada: nodo?.entrada,
    },
  }).nodo;

// RF-31 / RF-32: página del historial del backend → items del hilo. Cada
// interacción da el nodo recorrido y, salvo CONTINUAR, la burbuja de la
// respuesta. `textoDe(entrada, tipo, valor)` arma el texto igual que al
// responder (registro de entradas, RF-27).
function itemsDeInteraccion(interaccion, textoDe) {
  const id = interaccion.id_interaccion;
  const nodo = nodoDeHistorial(interaccion.nodo);
  const respuesta = interaccion.respuesta ?? {};
  const items = [{ tipo: 'nodo', id: `historial-${id}-nodo`, nodo }];

  if (
    respuesta.tipo_entrada == null ||
    respuesta.tipo_entrada === TIPO_ENTRADA.CONTINUAR ||
    respuesta.valor == null
  ) {
    return items;
  }

  items.push({
    tipo: 'respuesta',
    id: `historial-${id}-respuesta`,
    texto: textoRespuesta(respuesta, nodo.entrada, textoDe),
  });
  return items;
}

/*
 * `{ items, hay_mas, siguiente_cursor }` → página para el hilo.
 * - `items` llega en orden ascendente de secuencia.
 * - `ultimaSecuencia`: la del último item; 0 si la página está vacía. Solo
 *   la primera página (la más reciente) sirve para el siguiente envío.
 * - `secuenciaMinima`: el cursor para pedir la página anterior
 *   (`antes_de_secuencia`); `siguiente_cursor` o, si falta, la secuencia
 *   más baja de la página.
 */
export function mapHistorial(data, textoDe) {
  const interacciones = Array.isArray(data?.items)
    ? data.items.filter((i) => i !== null && typeof i === 'object')
    : [];
  const secuencias = interacciones
    .map((i) => i.secuencia)
    .filter(Number.isInteger);
  const hayMas = data?.hay_mas === true;
  const cursor = Number.isInteger(data?.siguiente_cursor)
    ? data.siguiente_cursor
    : null;

  return Object.freeze({
    ultimaSecuencia: secuencias.length > 0 ? Math.max(...secuencias) : 0,
    hayMas,
    secuenciaMinima:
      cursor ?? (secuencias.length > 0 ? Math.min(...secuencias) : null),
    items: Object.freeze(
      interacciones.flatMap((i) => itemsDeInteraccion(i, textoDe)),
    ),
  });
}

// Agrega una página anterior al principio sin repetir items (CA-32-2).
export function anteponerSinDuplicar(anteriores, actuales) {
  const ids = new Set(actuales.map((item) => item.id));

  return [...anteriores.filter((item) => !ids.has(item.id)), ...actuales];
}
