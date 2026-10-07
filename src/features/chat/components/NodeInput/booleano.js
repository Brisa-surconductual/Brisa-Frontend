export const booleano = Object.freeze({
  validar: (_entrada, respuesta) =>
    typeof respuesta === 'boolean' ? null : 'TIPO_DATO_INVALIDO',

  textoRespuesta: (entrada, respuesta) =>
    respuesta ? entrada.etiqueta_verdadero : entrada.etiqueta_falso,
});
