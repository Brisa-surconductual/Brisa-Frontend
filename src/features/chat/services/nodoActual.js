import { ALIAS_TIPO_ENTRADA, TIPO_ENTRADA } from '../types/tipoEntrada.js';

// D14: los bloques sin `orden` van al final; `sort` es estable, así que
// conservan el orden de llegada.
function compararOrden(a, b) {
  const sinA = typeof a.orden !== 'number';
  const sinB = typeof b.orden !== 'number';

  if (sinA || sinB) return Number(sinA) - Number(sinB);

  return a.orden - b.orden;
}

// A-014: traduce el nombre de configuración al canónico; un tipo que no
// está en la tabla se conserva. `hasOwn` evita leer `constructor` y
// similares del prototipo.
function tipoCanonico(tipo) {
  return Object.hasOwn(ALIAS_TIPO_ENTRADA, tipo)
    ? ALIAS_TIPO_ENTRADA[tipo]
    : tipo;
}

// D4: `min`, `max` y `paso` pueden llegar como texto (A-041). Un texto
// numérico pasa a número; lo demás queda en null. Ojo: Number('') es 0.
function aNumero(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== 'string' || valor.trim() === '') return null;

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

// D5 (FE-M03-04b): en FECHA_HORA los límites son texto con el formato
// de la fecha; convertirlos a número los perdería.
const aTexto = (valor) => (typeof valor === 'string' ? valor : null);

const esObjeto = (valor) => valor !== null && typeof valor === 'object';

// D4: solo las claves de la Etapa 2; los campos del contrato viejo no
// pasan.
function mapEntrada(entrada) {
  if (!esObjeto(entrada)) return null;

  const tipo = tipoCanonico(entrada.tipo);
  const limite = tipo === TIPO_ENTRADA.FECHA_HORA ? aTexto : aNumero;

  return Object.freeze({
    tipo,
    obligatorio: entrada.obligatorio === true,
    min: limite(entrada.min),
    max: limite(entrada.max),
    paso: aNumero(entrada.paso),
    opciones: Array.isArray(entrada.opciones)
      ? Object.freeze(entrada.opciones.filter(esObjeto))
      : null,
    etiquetas: esObjeto(entrada.etiquetas) ? entrada.etiquetas : null,
    maxCaracteres: aNumero(entrada.maxCaracteres),
    formato: entrada.formato ?? null,
  });
}

// RF-26: respuesta del backend → modelo de la interfaz. Solo las claves
// de la ficha. Los bloques se ordenan sobre una copia y su texto no se
// toca (CA-26-2, CA-26-3).
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
      entrada: mapEntrada(nodo.entrada),
    }),
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// D13: un idSesion sin forma de UUID es una dirección rota, no un error
// de API; no se consulta al backend.
export function esIdSesionValido(idSesion) {
  return typeof idSesion === 'string' && UUID.test(idSesion);
}
