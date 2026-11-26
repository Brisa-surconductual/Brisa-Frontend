// RF-25: "Flujo del árbol". Cada nodo es una hoja y cada transición una
// rama. Los nodos se ubican como un árbol real desde el nodo inicial (la
// raíz, arriba), siguiendo las transiciones reales (nunca por `orden`, que
// no define navegación) y el avance implícito de los nodos sin respuesta.
// Cada hijo queda centrado bajo su padre; el nodo final se dibuja abajo,
// centrado, porque todas las ramas terminan en él. Un nodo al que ninguna
// rama alcanza queda "sin conexión", igual que lo detecta el backend al
// publicar (RF-25 GRAFO_INVALIDO).
import {
  describirRegla,
  destinoImplicito,
} from '../../../../services/flujosAdmin.js';

export const CAJA_ANCHO = 184;
export const CAJA_ALTO = 68;
export const ESPACIO_X = 36;
// Espacio vertical amplio: la etiqueta de cada rama va en medio.
export const ESPACIO_Y = 88;

export const TIPO_RAMA = Object.freeze({
  REGLA: 'REGLA',
  POR_DEFECTO: 'POR_DEFECTO',
  IMPLICITA: 'IMPLICITA',
});

const ETIQUETA_RAMA_MAX = 26;

function ordenarPorOrdenYId(a, b) {
  const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
  const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;
  return ordenA !== ordenB
    ? ordenA - ordenB
    : String(a.id).localeCompare(String(b.id));
}

function recortar(texto) {
  return texto.length > ETIQUETA_RAMA_MAX
    ? `${texto.slice(0, ETIQUETA_RAMA_MAX).trimEnd()}…`
    : texto;
}

// Ramas del árbol: transiciones explícitas (en orden de evaluación) más el
// avance implícito de los nodos sin respuesta y sin transiciones.
function construirRamas(nodos, transiciones, porId) {
  const explicitas = [...transiciones]
    .filter((t) => porId.has(t.origenId) && porId.has(t.destinoId))
    .sort((a, b) => (a.ordenEvaluacion ?? 0) - (b.ordenEvaluacion ?? 0))
    .map((t) => {
      const porDefecto = t.esPorDefecto === true;
      const regla = describirRegla(t, porId.get(t.origenId));
      return {
        id: t.id,
        origenId: t.origenId,
        destinoId: t.destinoId,
        tipo: porDefecto ? TIPO_RAMA.POR_DEFECTO : TIPO_RAMA.REGLA,
        etiqueta: porDefecto
          ? 'Otra respuesta'
          : t.ordenEvaluacion
            ? recortar(`${t.ordenEvaluacion}. ${regla}`)
            : recortar(regla),
        titulo: regla,
      };
    });

  const implicitas = nodos.flatMap((nodo) => {
    const destino = destinoImplicito(nodo, nodos, transiciones);
    return destino
      ? [
          {
            id: `implicita-${nodo.id}`,
            origenId: nodo.id,
            destinoId: destino.id,
            tipo: TIPO_RAMA.IMPLICITA,
            etiqueta: 'Automática',
            titulo: 'Avanza al siguiente nodo por orden',
          },
        ]
      : [];
  });

  return [...explicitas, ...implicitas];
}

/**
 * @returns {{
 *   cajas: Array<{ nodo: object, fila: number, columna: number, x: number, y: number, huerfano: boolean }>,
 *   aristas: Array<{ id: string, tipo: string, etiqueta: string, titulo: string, x1: number, y1: number, x2: number, y2: number, d: string, lx: number, ly: number }>,
 *   ancho: number,
 *   alto: number,
 *   hayHuerfanos: boolean,
 * }}
 */
export function buildTreeLayout(nodos, transiciones) {
  const porId = new Map(nodos.map((nodo) => [nodo.id, nodo]));
  const ramas = construirRamas(nodos, transiciones, porId);
  const hijosDe = new Map();

  for (const rama of ramas) {
    if (!hijosDe.has(rama.origenId)) hijosDe.set(rama.origenId, []);
    hijosDe.get(rama.origenId).push(rama.destinoId);
  }

  // Recorrido en anchura desde la raíz: nivel y padre (el primero que lo
  // alcanza) de cada nodo. El padre define bajo qué rama se centra.
  const inicial = nodos.find((nodo) => nodo.esNodoInicial);
  const nivelDe = new Map();
  const padreDe = new Map();

  if (inicial) {
    nivelDe.set(inicial.id, 0);
    const pendientes = [inicial.id];

    while (pendientes.length > 0) {
      const actual = pendientes.shift();
      for (const destinoId of hijosDe.get(actual) ?? []) {
        if (!nivelDe.has(destinoId)) {
          nivelDe.set(destinoId, nivelDe.get(actual) + 1);
          padreDe.set(destinoId, actual);
          pendientes.push(destinoId);
        }
      }
    }
  }

  // El nodo final (si es alcanzable) va en su propia fila, la última.
  const final = nodos.find(
    (nodo) => nodo.esNodoFinal && nivelDe.has(nodo.id) && nodo !== inicial,
  );
  const nivelMaximo = Math.max(
    0,
    ...[...nivelDe.entries()]
      .filter(([id]) => id !== final?.id)
      .map(([, nivel]) => nivel),
  );
  if (final) nivelDe.set(final.id, nivelMaximo + 1);

  const hijosEnArbol = new Map();
  for (const [hijo, padre] of padreDe) {
    if (hijo === final?.id) continue;
    if (!hijosEnArbol.has(padre)) hijosEnArbol.set(padre, []);
    hijosEnArbol.get(padre).push(porId.get(hijo));
  }
  hijosEnArbol.forEach((hijos) => hijos.sort(ordenarPorOrdenYId));

  // Árbol ordenado: cada hoja ocupa una columna; un padre se centra sobre
  // el tramo de sus hijos.
  const columnaDe = new Map();
  let siguienteColumna = 0;
  const ubicar = (id) => {
    const hijos = hijosEnArbol.get(id) ?? [];
    if (hijos.length === 0) {
      columnaDe.set(id, siguienteColumna);
      siguienteColumna += 1;
      return;
    }
    hijos.forEach((hijo) => ubicar(hijo.id));
    const primera = columnaDe.get(hijos[0].id);
    const ultima = columnaDe.get(hijos[hijos.length - 1].id);
    columnaDe.set(id, (primera + ultima) / 2);
  };
  if (inicial) ubicar(inicial.id);
  const columnasArbol = Math.max(siguienteColumna, 1);
  if (final) columnaDe.set(final.id, (columnasArbol - 1) / 2);

  const huerfanos = nodos
    .filter((nodo) => !nivelDe.has(nodo.id))
    .sort(ordenarPorOrdenYId);
  const filaHuerfanos =
    nivelDe.size === 0 ? 0 : Math.max(...nivelDe.values()) + 1;
  huerfanos.forEach((nodo, indice) => {
    nivelDe.set(nodo.id, filaHuerfanos);
    columnaDe.set(nodo.id, indice);
  });

  const paso = CAJA_ANCHO + ESPACIO_X;
  const pasoFila = CAJA_ALTO + ESPACIO_Y;
  const huerfanosSet = new Set(huerfanos.map((n) => n.id));

  const cajas = nodos.map((nodo) => ({
    nodo,
    fila: nivelDe.get(nodo.id),
    columna: columnaDe.get(nodo.id),
    x: columnaDe.get(nodo.id) * paso,
    y: nivelDe.get(nodo.id) * pasoFila,
    huerfano: huerfanosSet.has(nodo.id),
  }));
  const cajaDe = new Map(cajas.map((caja) => [caja.nodo.id, caja]));

  // Rama curva del borde inferior del origen al borde superior del destino.
  const aristas = ramas.map((rama) => {
    const origen = cajaDe.get(rama.origenId);
    const destino = cajaDe.get(rama.destinoId);
    const x1 = origen.x + CAJA_ANCHO / 2;
    const y1 = origen.y + CAJA_ALTO;
    const x2 = destino.x + CAJA_ANCHO / 2;
    const y2 = destino.y;
    const curva = Math.max(Math.abs(y2 - y1) / 2, ESPACIO_Y / 2);
    return {
      ...rama,
      x1,
      y1,
      x2,
      y2,
      d: `M ${x1} ${y1} C ${x1} ${y1 + curva}, ${x2} ${y2 - curva}, ${x2} ${y2}`,
      lx: (x1 + x2) / 2,
      ly: (y1 + y2) / 2,
    };
  });

  const columnasTotales = Math.max(columnasArbol, huerfanos.length, 1);
  const filasTotales =
    cajas.length === 0 ? 0 : Math.max(...cajas.map((c) => c.fila)) + 1;

  return {
    cajas,
    aristas,
    ancho: cajas.length === 0 ? 0 : columnasTotales * paso - ESPACIO_X,
    alto: filasTotales === 0 ? 0 : filasTotales * pasoFila - ESPACIO_Y,
    hayHuerfanos: huerfanos.length > 0,
  };
}
