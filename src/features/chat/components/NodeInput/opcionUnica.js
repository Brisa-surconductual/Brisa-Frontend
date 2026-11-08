export const opcionUnica = Object.freeze({
  textoRespuesta: (entrada, valor) =>
    entrada.opciones?.find((opcion) => opcion.valor === valor)?.etiqueta ??
    String(valor),
});
