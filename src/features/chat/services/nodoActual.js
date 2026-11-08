// D14: los bloques sin `orden` van al final; `sort` es estable, así que
// conservan el orden de llegada.
function compararOrden(a, b) {
  const sinA = typeof a.orden !== 'number';
  const sinB = typeof b.orden !== 'number';

  if (sinA || sinB) return Number(sinA) - Number(sinB);

  return a.orden - b.orden;
}

// RF-26: respuesta del backend → modelo de la interfaz. Solo las claves
// de la ficha. Los bloques se ordenan sobre una copia y su texto no se
// toca (CA-26-2, CA-26-3); `entrada` pasa tal cual (es de FE-M03-04).
export function mapNodoActual(data) {
  const nodo = data?.nodo ?? {};
  // Un bloque que no es objeto no se puede presentar: se descarta.
  const bloques = Array.isArray(nodo.bloques)
    ? nodo.bloques.filter((b) => b !== null && typeof b === 'object')
    : [];

  return Object.freeze({
    idSesion: data?.idSesion ?? null,
    estadoSesion: data?.estadoSesion ?? null,
    nodo: Object.freeze({
      idNodo: nodo.idNodo,
      tipoNodo: nodo.tipoNodo,
      orden: nodo.orden,
      esTerminal: nodo.esTerminal === true,
      bloques: Object.freeze([...bloques].sort(compararOrden)),
      entrada: nodo.entrada ?? null,
    }),
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// D13: un idSesion sin forma de UUID es una dirección rota, no un error
// de API; no se consulta al backend.
export function esIdSesionValido(idSesion) {
  return typeof idSesion === 'string' && UUID.test(idSesion);
}
