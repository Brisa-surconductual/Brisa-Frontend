import { validarRespuesta } from '../../services/validacionRespuesta.js';

// Lo que hace el formulario al confirmar: normaliza (si el tipo lo pide),
// valida y arma el texto para la burbuja del estudiante.
export function resolverRespuesta(entrada, tipo, valor) {
  const candidata = tipo.normalizar ? tipo.normalizar(entrada, valor) : valor;
  const resultado = validarRespuesta(entrada, candidata, tipo.validar);
  if (!resultado.valido) return resultado;

  const { respuesta } = resultado;
  return {
    valido: true,
    respuesta,
    textoRespuesta:
      respuesta === null ? null : tipo.textoRespuesta(entrada, respuesta),
  };
}
