// es-CO sin separador de miles: el punto decimal pasa a coma.
export const conComa = (n) => String(n).replace('.', ',');

// Sin `normalizar`: la escala no tiene valor por defecto. Mientras el
// estudiante no la toque, el valor es null (A-034).
export const escala = Object.freeze({
  textoRespuesta: ({ max }, valor) =>
    max == null ? conComa(valor) : `${conComa(valor)}/${conComa(max)}`,
});
