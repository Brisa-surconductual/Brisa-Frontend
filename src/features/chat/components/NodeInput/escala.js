// es-CO sin separador de miles: el punto decimal pasa a coma.
export const conComa = (n) => String(n).replace('.', ',');

// Sin `normalizar`: la escala no tiene valor por defecto. Mientras el
// estudiante no la toque, el valor es null (ver aclaraciones).
export const escala = Object.freeze({
  // paso = 1 si falta: el mismo valor por defecto que usa el range nativo.
  validar: ({ min, max, paso = 1 }, valor) => {
    if (!Number.isFinite(valor)) return 'TIPO_DATO_INVALIDO';
    if (valor < min || valor > max) return 'FUERA_DE_RANGO';
    // Pasos contados desde min; la tolerancia absorbe 0.1 + 0.2 != 0.3.
    const pasos = (valor - min) / paso;
    return Math.abs(pasos - Math.round(pasos)) < 1e-9
      ? null
      : 'FORMATO_INVALIDO';
  },

  textoRespuesta: ({ max }, valor) => `${conComa(valor)}/${conComa(max)}`,
});
