// RF-25 (PR4): posiciona los nodos de un flujo como un árbol por niveles,
// desde el nodo inicial, siguiendo las transiciones reales (nunca por
// `orden`: el orden de un nodo no define su lugar en el árbol). Un nodo al
// que ninguna transición alcanza queda "sin conexión", igual que lo detecta
// el backend al publicar (ver RF-25 GRAFO_INVALIDO).
export const CAJA_ANCHO = 184;
export const CAJA_ALTO = 68;
export const ESPACIO_X = 36;
export const ESPACIO_Y = 56;

function ordenarPorOrdenYId(a, b) {
  const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
  const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;
  return ordenA !== ordenB
    ? ordenA - ordenB
    : String(a.id).localeCompare(String(b.id));
}

/**
 * @returns {{
 *   cajas: Array<{ nodo: object, fila: number, columna: number, x: number, y: number, huerfano: boolean }>,
 *   aristas: Array<{ id: string, x1: number, y1: number, x2: number, y2: number }>,
 *   ancho: number,
 *   alto: number,
 * }}
 */
export function buildTreeLayout(nodos, transiciones) {
  const porId = new Map(nodos.map((nodo) => [nodo.id, nodo]));
  const hijosDe = new Map();

  for (const transicion of transiciones) {
    if (!porId.has(transicion.origenId) || !porId.has(transicion.destinoId)) {
      continue;
    }
    if (!hijosDe.has(transicion.origenId)) hijosDe.set(transicion.origenId, []);
    hijosDe.get(transicion.origenId).push(transicion.destinoId);
  }

  const inicial = nodos.find((nodo) => nodo.esNodoInicial);
  const nivelDe = new Map();

  if (inicial) {
    nivelDe.set(inicial.id, 0);
    const pendientes = [inicial.id];

    while (pendientes.length > 0) {
      const actual = pendientes.shift();
      const nivelActual = nivelDe.get(actual);

      for (const destinoId of hijosDe.get(actual) ?? []) {
        if (!nivelDe.has(destinoId)) {
          nivelDe.set(destinoId, nivelActual + 1);
          pendientes.push(destinoId);
        }
      }
    }
  }

  const filas = [];
  const huerfanos = [];

  for (const nodo of nodos) {
    const nivel = nivelDe.get(nodo.id);
    if (nivel === undefined) {
      huerfanos.push(nodo);
      continue;
    }
    filas[nivel] = filas[nivel] ?? [];
    filas[nivel].push(nodo);
  }

  filas.forEach((fila) => fila.sort(ordenarPorOrdenYId));
  huerfanos.sort(ordenarPorOrdenYId);
  if (huerfanos.length > 0) filas.push(huerfanos);

  const posicionPorId = new Map();
  let maxColumnas = 1;

  filas.forEach((fila, indiceFila) => {
    maxColumnas = Math.max(maxColumnas, fila.length);
    fila.forEach((nodo, indiceColumna) => {
      posicionPorId.set(nodo.id, { fila: indiceFila, columna: indiceColumna });
    });
  });

  const cajas = filas.flatMap((fila, indiceFila) =>
    fila.map((nodo, indiceColumna) => ({
      nodo,
      fila: indiceFila,
      columna: indiceColumna,
      x: indiceColumna * (CAJA_ANCHO + ESPACIO_X),
      y: indiceFila * (CAJA_ALTO + ESPACIO_Y),
      huerfano: nivelDe.get(nodo.id) === undefined,
    })),
  );

  const centroX = (columna) =>
    columna * (CAJA_ANCHO + ESPACIO_X) + CAJA_ANCHO / 2;

  const aristas = transiciones
    .filter(
      (t) => posicionPorId.has(t.origenId) && posicionPorId.has(t.destinoId),
    )
    .map((t) => {
      const origen = posicionPorId.get(t.origenId);
      const destino = posicionPorId.get(t.destinoId);
      return {
        id: t.id,
        x1: centroX(origen.columna),
        y1: origen.fila * (CAJA_ALTO + ESPACIO_Y) + CAJA_ALTO,
        x2: centroX(destino.columna),
        y2: destino.fila * (CAJA_ALTO + ESPACIO_Y),
      };
    });

  return {
    cajas,
    aristas,
    ancho:
      cajas.length === 0
        ? 0
        : maxColumnas * (CAJA_ANCHO + ESPACIO_X) - ESPACIO_X,
    alto:
      filas.length === 0
        ? 0
        : filas.length * (CAJA_ALTO + ESPACIO_Y) - ESPACIO_Y,
    hayHuerfanos: huerfanos.length > 0,
  };
}
