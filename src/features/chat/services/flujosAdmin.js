import { CHAT_CLIENT_ERROR } from '../api/chatApiUtils.js';
import { ESTADO_FLUJO, NOMBRE_FLUJO_MAX } from '../types/estadoFlujo.js';

const MENSAJE_SIN_CONEXION =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const MENSAJE_GENERICO =
  'No fue posible completar la operación. Inténtalo de nuevo.';

// Respuesta del backend → modelo de la interfaz. No se muestra el perfil
// clínico: el árbol grupal no lo tiene.
export function mapFlujo(flujo) {
  return Object.freeze({
    id: flujo.id_flujo,
    nombre: flujo.nombre,
    estado: flujo.estado,
    version: flujo.version,
    fechaCreacion: flujo.fecha_creacion,
    fechaPublicacion: flujo.fecha_publicacion ?? null,
    fechaArchivado: flujo.fecha_archivado ?? null,
  });
}

export function mapListadoFlujos({ items, meta }) {
  const pageSize = meta.page_size || 1;

  return Object.freeze({
    items: items.map(mapFlujo),
    page: meta.page,
    totalPages: Math.max(1, Math.ceil(meta.total / pageSize)),
    total: meta.total,
  });
}

// Misma regla que el backend: texto no vacío, hasta 150 caracteres.
// Devuelve el mensaje de error o una cadena vacía si es válido.
export function validarNombreFlujo(nombre) {
  const limpio = typeof nombre === 'string' ? nombre.trim() : '';

  if (!limpio) return 'Escribe un nombre para el flujo.';
  if (limpio.length > NOMBRE_FLUJO_MAX) {
    return `El nombre no puede superar ${NOMBRE_FLUJO_MAX} caracteres.`;
  }

  return '';
}

// El `message` del backend se muestra tal cual (el 401 y los errores sin
// texto usan los del frontend).
export function describirErrorAdmin(error) {
  if (error?.code === CHAT_CLIENT_ERROR.SIN_CONEXION) {
    return MENSAJE_SIN_CONEXION;
  }

  return error?.backendMessage?.trim() || MENSAJE_GENERICO;
}

const ETIQUETA_MAX = 48;

function textoDelNodo(contenido) {
  return typeof contenido?.texto === 'string' ? contenido.texto : '';
}

function recortar(texto) {
  return texto.length > ETIQUETA_MAX
    ? `${texto.slice(0, ETIQUETA_MAX).trimEnd()}…`
    : texto;
}

// Inicial primero; luego por `orden` (sin orden al final) y por fecha.
function compararNodos(a, b) {
  if (a.esNodoInicial !== b.esNodoInicial) return a.esNodoInicial ? -1 : 1;

  const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
  const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;

  if (ordenA !== ordenB) return ordenA - ordenB;

  return String(a.fechaCreacion).localeCompare(String(b.fechaCreacion));
}

// Valor de la condición: el backend lo envía como objeto libre. Se muestra
// `clave: valor` sin asumir un formato propio.
export function describirCondicion(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor !== 'object') return String(valor);

  return Object.entries(valor)
    .map(
      ([clave, dato]) =>
        `${clave}: ${typeof dato === 'object' ? JSON.stringify(dato) : dato}`,
    )
    .join(' · ');
}

// RF-25: cambio de estado de un flujo grupal. Publicar y archivar piden
// confirmación en la interfaz (son visibles o irreversibles).
export const ACCION_FLUJO = Object.freeze({
  PUBLICAR: 'PUBLICAR',
  ARCHIVAR: 'ARCHIVAR',
});

// Qué cambio de estado se puede pedir sobre un flujo grupal:
// - borrador: publicarlo o archivarlo directamente.
// - publicado: solo archivarlo (no hay "despublicar").
// - archivado: ninguna; es un estado sin retorno (03-D/HU-05).
export function accionesEstadoDisponibles(estado) {
  switch (estado) {
    case ESTADO_FLUJO.BORRADOR:
      return [ACCION_FLUJO.PUBLICAR, ACCION_FLUJO.ARCHIVAR];
    case ESTADO_FLUJO.PUBLICADO:
      return [ACCION_FLUJO.ARCHIVAR];
    default:
      return [];
  }
}

export const MENSAJE_ACCION_FLUJO = Object.freeze({
  [ACCION_FLUJO.PUBLICAR]: 'Flujo publicado.',
  [ACCION_FLUJO.ARCHIVAR]: 'Flujo archivado.',
});

export function mapNodo(nodo) {
  return Object.freeze({
    id: nodo.id_nodo,
    idTipoNodo: nodo.id_tipo_nodo,
    tipoNodo: nodo.tipo_nodo,
    // Contenido completo: al editar solo cambia `texto`, el resto se conserva.
    contenido: nodo.contenido ?? {},
    // Texto del nodo tal cual lo definió psicología (RF-26).
    texto: textoDelNodo(nodo.contenido),
    esNodoInicial: nodo.es_nodo_inicial === true,
    orden: nodo.orden ?? null,
    idContenidoCronograma: nodo.id_contenido_cronograma ?? null,
    fechaCreacion: nodo.fecha_creacion,
  });
}

export function mapTransicion(transicion) {
  return Object.freeze({
    id: transicion.id_regla,
    origenId: transicion.id_nodo_origen,
    destinoId: transicion.id_nodo_destino,
    operador: transicion.operador_condicion,
    condicion: describirCondicion(transicion.valor_condicion),
    ordenEvaluacion: transicion.orden_evaluacion,
  });
}

// Árbol listo para pintar: nodos ordenados con una etiqueta corta y
// transiciones con el nombre de su origen y su destino.
export function mapArbol({ flujo, nodos, transiciones }) {
  const ordenados = nodos.map(mapNodo).sort(compararNodos);

  const conEtiqueta = ordenados.map((nodo, indice) =>
    Object.freeze({
      ...nodo,
      etiqueta: nodo.texto
        ? `${indice + 1}. ${recortar(nodo.texto)}`
        : `${indice + 1}. (sin texto)`,
    }),
  );

  const etiquetaPorId = new Map(conEtiqueta.map((n) => [n.id, n.etiqueta]));

  return Object.freeze({
    flujo: mapFlujo(flujo),
    nodos: conEtiqueta,
    transiciones: transiciones
      .map(mapTransicion)
      .sort((a, b) => a.ordenEvaluacion - b.ordenEvaluacion)
      .map((t) =>
        Object.freeze({
          ...t,
          origen: etiquetaPorId.get(t.origenId) ?? 'Nodo desconocido',
          destino: etiquetaPorId.get(t.destinoId) ?? 'Nodo desconocido',
        }),
      ),
  });
}
