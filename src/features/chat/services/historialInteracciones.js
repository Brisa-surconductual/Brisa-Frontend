import { TIPO_ENTRADA } from '../types/tipoEntrada.js';

import { mapNodoActual } from './nodoActual.js';

// RF-32: página del historial del backend → items del hilo. Cada
// interacción da el nodo recorrido (bloques sin modificar, RF-26) y, salvo
// CONTINUAR, la burbuja de la respuesta. `textoDe(entrada, tipo, valor)`
// arma el texto igual que al responder (registro de entradas, RF-27), así
// la burbuja muestra la etiqueta y no el valor interno.
function itemsDeInteraccion(interaccion, textoDe) {
  const id = interaccion.id_interaccion;
  const { nodo } = mapNodoActual({ nodo: interaccion.nodo });
  const tipo = interaccion.respuesta?.tipo_entrada ?? null;
  const valor = interaccion.respuesta?.valor ?? null;
  const items = [{ tipo: 'nodo', id: `historial-${id}-nodo`, nodo }];

  if (tipo === null || tipo === TIPO_ENTRADA.CONTINUAR || valor === null) {
    return items;
  }

  const texto = nodo.entrada ? textoDe(nodo.entrada, tipo, valor) : null;

  items.push({
    tipo: 'respuesta',
    id: `historial-${id}-respuesta`,
    texto: texto ?? String(valor),
  });
  return items;
}

export function mapHistorial(data, textoDe) {
  const interacciones = Array.isArray(data?.interacciones)
    ? data.interacciones.filter((i) => i !== null && typeof i === 'object')
    : [];
  const secuencias = interacciones
    .map((i) => i.secuencia)
    .filter(Number.isInteger);

  return Object.freeze({
    ultimaSecuencia: Number.isInteger(data?.ultima_secuencia)
      ? data.ultima_secuencia
      : 0,
    hayMas: data?.hay_mas === true,
    // Para pedir la página anterior (`antes_de`).
    secuenciaMinima: secuencias.length > 0 ? Math.min(...secuencias) : null,
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
