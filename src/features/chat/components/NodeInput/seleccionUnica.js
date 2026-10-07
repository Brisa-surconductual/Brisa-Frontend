const opcionDe = (entrada, valor) =>
  entrada.opciones.find((opcion) => opcion.valor === valor);

export const seleccionUnica = Object.freeze({
  validar: (entrada, respuesta) =>
    typeof respuesta === 'string' && opcionDe(entrada, respuesta)
      ? null
      : 'OPCION_NO_VALIDA',

  textoRespuesta: (entrada, respuesta) => opcionDe(entrada, respuesta).etiqueta,
});
