// Contrato 5, "Errores de validación": mismos textos que el backend.
export const MENSAJES_VALIDACION = Object.freeze({
  RESPUESTA_OBLIGATORIA: 'Este campo es obligatorio.',
  TIPO_DATO_INVALIDO: 'El formato de la respuesta no es válido.',
  FORMATO_INVALIDO: 'El formato de la respuesta es incorrecto.',
  FUERA_DE_RANGO: 'El valor ingresado está fuera del rango permitido.',
  OPCION_NO_VALIDA:
    'La respuesta seleccionada no es válida para esta pregunta.',
});

export const respuestaVacia = (respuesta) =>
  respuesta == null ||
  (typeof respuesta === 'string' && respuesta.trim() === '') ||
  (Array.isArray(respuesta) && respuesta.length === 0);

const invalida = (entrada, codigo) => ({
  valido: false,
  codigo,
  // Contrato 5: `mensaje_error` del nodo reemplaza al genérico.
  mensaje: entrada.mensaje_error || MENSAJES_VALIDACION[codigo],
});

// RF-28: validación local. El backend sigue siendo la fuente de verdad.
// `validarTipo(entrada, respuesta)` devuelve un código o null; solo se
// llama con respuestas no vacías.
export function validarRespuesta(entrada, respuesta, validarTipo) {
  if (respuestaVacia(respuesta)) {
    return entrada.obligatorio
      ? invalida(entrada, 'RESPUESTA_OBLIGATORIA')
      : { valido: true, respuesta: null };
  }

  const codigo = validarTipo(entrada, respuesta);
  return codigo ? invalida(entrada, codigo) : { valido: true, respuesta };
}
