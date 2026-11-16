import { TIPO_BLOQUE, TIPO_ENTRADA } from '../../types/index.js';
import { mapNodoActual } from '../nodoActual.js';

// Bloque del contrato 5a que remite a un recurso multimedia del paquete.
export const BLOQUE_RECURSO = 'RECURSO';

// Bloques de texto que la interfaz pinta tal cual (RF-26).
const TEXTUALES = Object.freeze([TIPO_BLOQUE.TEXTO, TIPO_BLOQUE.INSTRUCCION]);

export function buscarNodoPaquete(paquete, idNodo) {
  if (!Array.isArray(paquete?.nodos) || typeof idNodo !== 'string') return null;

  return paquete.nodos.find((nodo) => nodo?.id_nodo === idNodo) ?? null;
}

const esObjeto = (valor) => valor !== null && typeof valor === 'object';

/*
 * Nodo del paquete (contrato 5a, snake_case) → el mismo modelo que pinta
 * la conversación en línea (mapNodoActual). Los bloques RECURSO no se
 * pintan aquí: su presentación es del componente multimedia (tarea 1);
 * se devuelven sus `id_recurso` para comprobar si están en el
 * dispositivo. Un bloque de otro tipo tampoco se puede presentar y se
 * cuenta en `otrosNoPresentables`.
 */
export function aNodoInterfaz(nodoPaquete) {
  const bloques = Array.isArray(nodoPaquete.bloques)
    ? nodoPaquete.bloques.filter(esObjeto)
    : [];
  const idsRecurso = [];
  let otrosNoPresentables = 0;

  for (const bloque of bloques) {
    if (
      bloque.tipo === BLOQUE_RECURSO &&
      typeof bloque.id_recurso === 'string'
    ) {
      idsRecurso.push(bloque.id_recurso);
    } else if (!TEXTUALES.includes(bloque.tipo)) {
      otrosNoPresentables += 1;
    }
  }

  const { nodo } = mapNodoActual({
    nodo: {
      idNodo: nodoPaquete.id_nodo,
      tipoNodo: nodoPaquete.tipo_nodo,
      orden: nodoPaquete.orden,
      esTerminal: nodoPaquete.es_terminal,
      bloques: bloques
        .filter((bloque) => TEXTUALES.includes(bloque.tipo))
        .map(({ orden, tipo, texto }) => ({ orden, tipo, texto })),
      entrada: nodoPaquete.entrada,
    },
  });

  return Object.freeze({
    nodo,
    idsRecurso: Object.freeze([...new Set(idsRecurso)]),
    otrosNoPresentables,
  });
}

// El nodo no pide dato: se responde CONTINUAR con valor null (CA-27-6).
export const esInformativo = (nodo) =>
  !nodo.entrada || nodo.entrada.tipo === TIPO_ENTRADA.CONTINUAR;
