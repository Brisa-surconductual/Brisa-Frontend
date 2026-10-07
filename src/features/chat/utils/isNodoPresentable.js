// RF-26: un nodo sin texto no se pinta. trim() solo sirve para comprobar;
// el texto que se muestra nunca se recorta.
export const isNodoPresentable = (nodo) => {
  const texto = nodo?.contenido?.texto;
  return typeof texto === 'string' && texto.trim() !== '';
};
