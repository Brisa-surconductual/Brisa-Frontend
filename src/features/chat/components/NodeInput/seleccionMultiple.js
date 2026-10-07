const limites = ({ min_selecciones, max_selecciones }) => ({
  min: min_selecciones ?? 0,
  max: max_selecciones ?? Infinity,
});

export const seleccionMultiple = Object.freeze({
  validar: (entrada, respuesta) => {
    const valida =
      Array.isArray(respuesta) &&
      new Set(respuesta).size === respuesta.length &&
      respuesta.every((v) => entrada.opciones.some((o) => o.valor === v));
    if (!valida) return 'OPCION_NO_VALIDA';

    const { min, max } = limites(entrada);
    // Ver aclaraciones: el contrato no tiene código propio para esto.
    return respuesta.length < min || respuesta.length > max
      ? 'FUERA_DE_RANGO'
      : null;
  },

  // Etiquetas en el orden de las opciones, no en el orden en que se marcaron.
  textoRespuesta: (entrada, respuesta) =>
    entrada.opciones
      .filter((o) => respuesta.includes(o.valor))
      .map((o) => o.etiqueta)
      .join(', '),
});

export const alternarSeleccion = (seleccion, valor, max) => {
  if (seleccion.includes(valor)) return seleccion.filter((v) => v !== valor);
  if (seleccion.length >= (max ?? Infinity)) return seleccion;
  return [...seleccion, valor];
};

export const textoAyuda = (min, max) => {
  if (min != null && max != null) return `Elige entre ${min} y ${max}`;
  if (min != null) return `Elige al menos ${min}`;
  if (max != null) return `Elige hasta ${max}`;
  return null;
};
