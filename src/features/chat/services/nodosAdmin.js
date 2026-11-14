// RF-25: formulario de nodos (crear y editar) de un flujo en borrador.
// El contenido que se edita aquí es solo `contenido.texto`; el resto de las
// claves de `contenido` se conservan intactas al editar.

export const VALORES_NODO_VACIOS = Object.freeze({
  idTipoNodo: '',
  texto: '',
  esNodoInicial: false,
  orden: '',
  idContenidoCronograma: '',
});

export function valoresDesdeNodo(nodo) {
  return {
    idTipoNodo: nodo.idTipoNodo,
    texto: nodo.texto,
    esNodoInicial: nodo.esNodoInicial,
    orden: nodo.orden === null ? '' : String(nodo.orden),
    idContenidoCronograma: nodo.idContenidoCronograma ?? '',
  };
}

// Catálogo `tipos_nodo` → opciones del selector.
export function opcionesTipoNodo(tiposNodo) {
  return (Array.isArray(tiposNodo) ? tiposNodo : []).map((tipo) => ({
    value: tipo.id_tipo_nodo,
    label: tipo.nombre,
  }));
}

// Catálogo `contenidos_cronograma` → opciones del selector. Son contenidos
// ya asociados a una unidad temporal (nunca contenido sin cronograma).
export function opcionesContenidoCronograma(contenidosCronograma) {
  return (Array.isArray(contenidosCronograma) ? contenidosCronograma : []).map(
    (item) => ({
      value: item.id_contenido_cronograma,
      label: `${item.nombre_contenido} · ${item.nombre_unidad}`,
    }),
  );
}

// Nombre a mostrar del contenido asociado a un nodo (solo lectura), a
// partir del catálogo `contenidos_cronograma`. Cadena vacía si no aplica.
export function nombreContenidoCronograma(
  contenidosCronograma,
  idContenidoCronograma,
) {
  if (!idContenidoCronograma) return '';

  const item = (
    Array.isArray(contenidosCronograma) ? contenidosCronograma : []
  ).find((c) => c.id_contenido_cronograma === idContenidoCronograma);

  return item ? `${item.nombre_contenido} · ${item.nombre_unidad}` : '';
}

// Devuelve un objeto con un mensaje por campo inválido ({} si todo es válido).
export function validarNodo(valores) {
  const errores = {};

  if (!valores.idTipoNodo) errores.idTipoNodo = 'Elige el tipo de nodo.';
  if (!valores.texto.trim()) errores.texto = 'Escribe el texto del nodo.';

  const orden = String(valores.orden).trim();

  if (orden !== '' && !/^[1-9]\d*$/.test(orden)) {
    errores.orden = 'El orden debe ser un número entero desde 1.';
  }

  return errores;
}

export function payloadCrearNodo(valores) {
  const payload = {
    id_tipo_nodo: valores.idTipoNodo,
    contenido: { texto: valores.texto },
    es_nodo_inicial: valores.esNodoInicial,
  };
  const orden = String(valores.orden).trim();

  if (orden !== '') payload.orden = Number(orden);
  if (valores.idContenidoCronograma) {
    payload.id_contenido_cronograma = valores.idContenidoCronograma;
  }

  return payload;
}

// Solo viaja lo que cambió (el backend rechaza un PATCH vacío). Devuelve
// null si no hay cambios.
export function payloadActualizarNodo(nodo, valores) {
  const cambios = {};
  const orden =
    String(valores.orden).trim() === '' ? null : Number(valores.orden);
  const idContenidoCronograma = valores.idContenidoCronograma || null;

  if (valores.idTipoNodo !== nodo.idTipoNodo)
    cambios.id_tipo_nodo = valores.idTipoNodo;
  if (valores.texto !== nodo.texto) {
    cambios.contenido = { ...nodo.contenido, texto: valores.texto };
  }
  if (valores.esNodoInicial !== nodo.esNodoInicial) {
    cambios.es_nodo_inicial = valores.esNodoInicial;
  }
  if (orden !== nodo.orden) cambios.orden = orden;
  if (idContenidoCronograma !== (nodo.idContenidoCronograma ?? null)) {
    cambios.id_contenido_cronograma = idContenidoCronograma;
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
}
