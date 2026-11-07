// RF-25: formulario de nodos (crear y editar) de un flujo en borrador.
// El contenido que se edita aquí es solo `contenido.texto`; el resto de las
// claves de `contenido` se conservan intactas al editar.

export const VALORES_NODO_VACIOS = Object.freeze({
  idTipoNodo: '',
  texto: '',
  esNodoInicial: false,
  orden: '',
});

export function valoresDesdeNodo(nodo) {
  return {
    idTipoNodo: nodo.idTipoNodo,
    texto: nodo.texto,
    esNodoInicial: nodo.esNodoInicial,
    orden: nodo.orden === null ? '' : String(nodo.orden),
  };
}

// Catálogo `tipos_nodo` → opciones del selector.
export function opcionesTipoNodo(tiposNodo) {
  return (Array.isArray(tiposNodo) ? tiposNodo : []).map((tipo) => ({
    value: tipo.id_tipo_nodo,
    label: tipo.nombre,
  }));
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

  return payload;
}

// Solo viaja lo que cambió (el backend rechaza un PATCH vacío). Devuelve
// null si no hay cambios.
export function payloadActualizarNodo(nodo, valores) {
  const cambios = {};
  const orden =
    String(valores.orden).trim() === '' ? null : Number(valores.orden);

  if (valores.idTipoNodo !== nodo.idTipoNodo)
    cambios.id_tipo_nodo = valores.idTipoNodo;
  if (valores.texto !== nodo.texto) {
    cambios.contenido = { ...nodo.contenido, texto: valores.texto };
  }
  if (valores.esNodoInicial !== nodo.esNodoInicial) {
    cambios.es_nodo_inicial = valores.esNodoInicial;
  }
  if (orden !== nodo.orden) cambios.orden = orden;

  return Object.keys(cambios).length > 0 ? cambios : null;
}
