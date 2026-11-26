const esVacia = (valor) =>
  valor == null ||
  (typeof valor === 'string' && valor.trim() === '') ||
  (Array.isArray(valor) && valor.length === 0);

// Lo que hace el formulario al confirmar: convierte (si el tipo lo pide) y
// arma el texto de la burbuja. No valida (D2): una respuesta vacía viaja
// como null y, si era obligatoria, el backend responde
// RESPUESTA_OBLIGATORIA.
export function resolverRespuesta(entrada, tipo, crudo) {
  const convertido = tipo.normalizar ? tipo.normalizar(entrada, crudo) : crudo;
  const valor = esVacia(convertido) ? null : convertido;

  return {
    valor,
    textoRespuesta: valor === null ? null : tipo.textoRespuesta(entrada, valor),
  };
}
