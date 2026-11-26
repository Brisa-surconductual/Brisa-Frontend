// D8: sin `normalizar`; RF-27 pide capturar la respuesta sin modificar su
// estructura. El texto de solo espacios ya viaja como null en
// `resolverRespuesta`. D2: sin `validar`.
export const textoLibre = Object.freeze({
  // Completo y sin recortar: la burbuja respeta los saltos de línea.
  textoRespuesta: (_entrada, valor) => valor,
});

// D7 y D14: solo informa; no marca error ni bloquea el envío. Si se pasa
// de `maxCaracteres`, el backend responde FUERA_DE_RANGO.
export const contador = ({ maxCaracteres }, valor) => {
  const n = (valor ?? '').length;
  if (maxCaracteres != null) return `${n} de ${maxCaracteres} caracteres`;
  return `${n} ${n === 1 ? 'carácter' : 'caracteres'}`;
};
