export const multiseleccion = Object.freeze({
  // Etiquetas en el orden de las opciones, no en el orden en que se marcaron.
  textoRespuesta: (entrada, valor) =>
    (entrada.opciones ?? [])
      .filter((o) => valor.includes(o.valor))
      .map((o) => o.etiqueta)
      .join(', '),
});

// CA-27-5: marcar dos veces quita; nunca hay repetidos.
export const alternarSeleccion = (seleccion, valor) =>
  seleccion.includes(valor)
    ? seleccion.filter((v) => v !== valor)
    : [...seleccion, valor];

// D5: mientras A-022 siga abierta, `min` y `max` solo se muestran; no
// limitan la selección.
export const textoAyuda = (min, max) =>
  min != null && max != null ? `Elige entre ${min} y ${max} opciones` : null;
