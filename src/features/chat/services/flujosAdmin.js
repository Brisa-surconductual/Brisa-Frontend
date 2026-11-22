import { CHAT_CLIENT_ERROR } from '../api/chatApiUtils.js';
import {
  DIMENSION_PERFIL_CLINICO_ETIQUETA,
  etiquetaValorPerfilClinico,
} from '../types/dimensionPerfilClinico.js';
import { ESTADO_FLUJO, NOMBRE_FLUJO_MAX } from '../types/estadoFlujo.js';
import { OPERADOR_CONDICION } from '../types/operadorCondicion.js';
import { ALIAS_TIPO_ENTRADA, TIPO_ENTRADA } from '../types/tipoEntrada.js';

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

// Inicial primero y final al último; luego por `orden` (sin orden al
// final) y por fecha.
function compararNodos(a, b) {
  if (a.esNodoInicial !== b.esNodoInicial) return a.esNodoInicial ? -1 : 1;
  if (a.esNodoFinal !== b.esNodoFinal) return a.esNodoFinal ? 1 : -1;

  const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
  const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;

  if (ordenA !== ordenB) return ordenA - ordenB;

  return String(a.fechaCreacion).localeCompare(String(b.fechaCreacion));
}

// Identifica un nodo de `detalles` (RF-25, GRAFO_INVALIDO) sin asumir que el
// texto o el orden existan: el backend solo garantiza el id.
function etiquetaNodoDiagnostico(nodo) {
  const base =
    nodo?.orden !== null && nodo?.orden !== undefined
      ? `nodo con orden ${nodo.orden}`
      : 'nodo sin orden';

  return typeof nodo?.texto === 'string' && nodo.texto.trim()
    ? `${base} ("${recortar(nodo.texto.trim())}")`
    : base;
}

// RF-25: traduce `detalles` del 422 GRAFO_INVALIDO a frases concretas sobre
// qué falla y qué nodos involucra, en vez de un mensaje genérico. Devuelve
// [] si no hay detalle (otro tipo de error).
export function describirCondicionesGrafoInvalido(detalles) {
  if (!detalles || typeof detalles !== 'object') return [];

  const condiciones = [];

  if (detalles.sin_nodo_inicial) {
    condiciones.push(
      'Falta un nodo inicial: ningún nodo está marcado como punto de partida (o hay más de uno).',
    );
  }

  // RF-25: el flujo debe cerrar en exactamente un nodo final.
  if (detalles.sin_nodo_final) {
    condiciones.push(
      'Falta el nodo final: marca un nodo como "Es el nodo final del flujo" (solo uno).',
    );
  }

  const sinSalida = Array.isArray(detalles.nodos_sin_salida)
    ? detalles.nodos_sin_salida
    : [];
  if (sinSalida.length > 0) {
    const lista = sinSalida.map(etiquetaNodoDiagnostico).join(', ');
    condiciones.push(
      sinSalida.length === 1
        ? `Hay un nodo sin salida que no es el nodo final: ${lista}.`
        : `Hay ${sinSalida.length} nodos sin salida que no son el nodo final: ${lista}.`,
    );
  }

  const huerfanos = Array.isArray(detalles.nodos_huerfanos)
    ? detalles.nodos_huerfanos
    : [];
  if (huerfanos.length > 0) {
    const lista = huerfanos.map(etiquetaNodoDiagnostico).join(', ');
    condiciones.push(
      huerfanos.length === 1
        ? `Hay un nodo sin conexión al flujo: ${lista}.`
        : `Hay ${huerfanos.length} nodos sin conexión al flujo: ${lista}.`,
    );
  }

  const ciclos = Array.isArray(detalles.ciclos) ? detalles.ciclos : [];
  if (ciclos.length === 1) {
    condiciones.push(
      `Hay un ciclo entre nodos: ${ciclos[0].map(etiquetaNodoDiagnostico).join(' → ')}.`,
    );
  } else if (ciclos.length > 1) {
    ciclos.forEach((ciclo, indice) => {
      condiciones.push(
        `Ciclo ${indice + 1}: ${ciclo.map(etiquetaNodoDiagnostico).join(' → ')}.`,
      );
    });
  }

  return condiciones;
}

// RF-25: traduce `detalles` del 422 NODO_CAPTURA_PERFIL_INVALIDO a frases
// concretas sobre qué dimensión clínica falla y por qué. Devuelve [] si no
// hay detalle (otro tipo de error).
export function describirCondicionesCapturaPerfil(detalles) {
  if (!detalles || typeof detalles !== 'object') return [];

  const etiqueta = (dimension) =>
    DIMENSION_PERFIL_CLINICO_ETIQUETA[dimension] ?? dimension;
  const lista = (valor) =>
    (Array.isArray(valor) ? valor : []).map(etiqueta).join(', ');

  const condiciones = [];

  if (detalles.dimensiones_ausentes?.length > 0) {
    condiciones.push(
      `Falta un nodo de captura para: ${lista(detalles.dimensiones_ausentes)}.`,
    );
  }
  if (detalles.dimensiones_duplicadas?.length > 0) {
    condiciones.push(
      `Hay más de un nodo de captura para: ${lista(detalles.dimensiones_duplicadas)}.`,
    );
  }
  if (detalles.dimensiones_valores_invalidos?.length > 0) {
    condiciones.push(
      `El nodo de captura no tiene una regla con los valores clínicos correctos para: ${lista(detalles.dimensiones_valores_invalidos)}.`,
    );
  }
  // RF-25/RF-27B: captura por valor; cada valor debe tener su nodo.
  (Array.isArray(detalles.dimensiones_valores_faltantes)
    ? detalles.dimensiones_valores_faltantes
    : []
  ).forEach(({ dimension, valores_faltantes: faltantes }) => {
    const valores = (Array.isArray(faltantes) ? faltantes : [])
      .map((valor) => etiquetaValorPerfilClinico(dimension, valor) || valor)
      .join(', ');
    condiciones.push(
      `Falta un nodo que capture ${etiqueta(dimension)}: ${valores}.`,
    );
  });

  return condiciones;
}

// RF-25: traduce `detalles` del 422 COBERTURA_INCOMPLETA (respuestas de
// selección única o Sí/No sin transición) a frases con las etiquetas que el
// administrativo reconoce. `nodos` son los del árbol ya mapeado.
export function describirCondicionesCoberturaIncompleta(detalles, nodos) {
  const faltantes = Array.isArray(detalles?.nodos_sin_cobertura)
    ? detalles.nodos_sin_cobertura
    : [];
  const porId = new Map(
    (Array.isArray(nodos) ? nodos : []).map((n) => [n.id, n]),
  );

  return faltantes.map((faltante) => {
    const nodo = porId.get(faltante.id_nodo);
    const etiquetaOpcion = new Map(
      (Array.isArray(nodo?.entrada?.opciones) ? nodo.entrada.opciones : []).map(
        (opcion) => [opcion.valor, opcion.etiqueta],
      ),
    );
    const etiqueta = (valor) =>
      valor === 'true'
        ? 'Sí'
        : valor === 'false'
          ? 'No'
          : (etiquetaOpcion.get(valor) ?? valor);
    const valores = (faltante.valores_faltantes ?? []).map(etiqueta).join(', ');
    return `En ${nodo?.etiqueta ?? etiquetaNodoDiagnostico(faltante)} falta una transición para: ${valores}.`;
  });
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
    // RF-25: nodo de cierre del flujo.
    esNodoFinal: nodo.es_nodo_final === true,
    orden: nodo.orden ?? null,
    // RF-25/RF-24: el nodo se liga al contenido; cada estudiante lo recorre
    // según su programación en su propio cronograma.
    idContenido: nodo.id_contenido ?? null,
    // Objeto crudo (PR4): lo necesita el formulario para precargar la
    // respuesta configurada. `null` si el nodo no espera respuesta.
    entrada:
      nodo.contenido?.entrada && typeof nodo.contenido.entrada === 'object'
        ? nodo.contenido.entrada
        : null,
    fechaCreacion: nodo.fecha_creacion,
  });
}

// RF-25: cada transición trae su regla propia (operador y valor esperado);
// `null` cuando el nodo origen no espera respuesta (transición automática).
function mapRegla(regla) {
  if (!regla) return null;
  return Object.freeze({
    id: regla.id_regla_validacion,
    operador: regla.operador_condicion,
    // Objeto crudo: lo necesita el formulario para precargar el valor.
    valorEsperado: regla.valor_esperado,
    tipoDato: regla.tipo_dato,
    mensajeError: regla.mensaje_error,
  });
}

export const TEXTO_CUALQUIER_OTRA = 'Cualquier otra respuesta';

export function mapTransicion(transicion) {
  const regla = mapRegla(transicion.regla_validacion);
  const esPorDefecto = regla?.operador === OPERADOR_CONDICION.SIEMPRE;
  return Object.freeze({
    // El backend responde `id_transicion` al crear/editar y `id_regla` en el árbol.
    id: transicion.id_regla ?? transicion.id_transicion,
    origenId: transicion.id_nodo_origen,
    destinoId: transicion.id_nodo_destino,
    operador: regla?.operador ?? null,
    condicion: esPorDefecto
      ? TEXTO_CUALQUIER_OTRA
      : regla
        ? describirCondicion(regla.valorEsperado)
        : 'Transición automática',
    regla,
    // RF-25: "cualquier otra respuesta" (operador SIEMPRE), siempre última.
    esPorDefecto,
    ordenEvaluacion: transicion.orden_evaluacion,
  });
}

function etiquetaValor(nodo, valor) {
  if (valor === true || valor === 'true') return 'Sí';
  if (valor === false || valor === 'false') return 'No';
  const opciones = Array.isArray(nodo?.entrada?.opciones)
    ? nodo.entrada.opciones
    : [];
  const opcion = opciones.find(
    (o) => (typeof o === 'string' ? o : o?.valor) === valor,
  );
  if (typeof opcion === 'string') return opcion;
  return opcion?.etiqueta ?? String(valor);
}

// RF-25: regla de una transición en palabras del administrativo, usando
// las etiquetas de las opciones del nodo origen.
export function describirRegla(transicion, nodoOrigen) {
  const regla = transicion?.regla;
  if (!regla) {
    return transicion?.operador && transicion?.condicion
      ? transicion.condicion
      : 'Automática';
  }
  if (regla.operador === OPERADOR_CONDICION.SIEMPRE) {
    return TEXTO_CUALQUIER_OTRA;
  }
  const esperado = regla.valorEsperado ?? {};
  if (regla.operador === OPERADOR_CONDICION.RANGO) {
    return `Si responde entre ${esperado.min} y ${esperado.max}`;
  }
  const valor = esperado.valor;
  if (Array.isArray(valor)) {
    return `Si elige ${valor.map((v) => `«${etiquetaValor(nodoOrigen, v)}»`).join(' + ')}`;
  }
  return `Si responde «${etiquetaValor(nodoOrigen, valor)}»`;
}

function esSinRespuesta(nodo) {
  const tipo = nodo?.entrada
    ? (ALIAS_TIPO_ENTRADA[nodo.entrada.tipo] ?? nodo.entrada.tipo)
    : TIPO_ENTRADA.CONTINUAR;
  return tipo === TIPO_ENTRADA.CONTINUAR;
}

// RF-25: misma regla que el backend. En flujos con nodo final, un nodo sin
// respuesta y sin transiciones avanza al siguiente nodo por `orden`.
export function destinoImplicito(nodo, nodos, transiciones) {
  const lista = Array.isArray(nodos) ? nodos : [];
  if (!nodo || nodo.esNodoFinal || nodo.orden === null) return null;
  if (!lista.some((n) => n.esNodoFinal)) return null;
  if (!esSinRespuesta(nodo)) return null;
  if ((transiciones ?? []).some((t) => t.origenId === nodo.id)) return null;
  return lista
    .filter((n) => n.id !== nodo.id && n.orden !== null && n.orden > nodo.orden)
    .reduce(
      (mejor, n) => (mejor === null || n.orden < mejor.orden ? n : mejor),
      null,
    );
}

// RF-25: salidas de un nodo en el orden en que el motor las evalúa, para
// la tarjeta del nodo. Incluye el avance implícito cuando aplica.
export function salidasOrdenadasDeNodo(nodo, nodos, transiciones) {
  const porId = new Map((nodos ?? []).map((n) => [n.id, n]));
  const propias = (transiciones ?? [])
    .filter((t) => t.origenId === nodo.id)
    .sort((a, b) => a.ordenEvaluacion - b.ordenEvaluacion);

  if (propias.length === 0) {
    const siguiente = destinoImplicito(nodo, nodos, transiciones);
    return siguiente
      ? [
          Object.freeze({
            id: `implicita-${nodo.id}`,
            orden: null,
            regla: 'Automática (siguiente por orden)',
            destino: siguiente.etiqueta ?? '',
            destinoId: siguiente.id,
            esPorDefecto: false,
            esImplicita: true,
          }),
        ]
      : [];
  }

  return propias.map((t) =>
    Object.freeze({
      id: t.id,
      orden: t.ordenEvaluacion,
      regla: describirRegla(t, nodo),
      destino: porId.get(t.destinoId)?.etiqueta ?? 'Nodo desconocido',
      destinoId: t.destinoId,
      esPorDefecto: t.esPorDefecto === true,
      esImplicita: false,
    }),
  );
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
