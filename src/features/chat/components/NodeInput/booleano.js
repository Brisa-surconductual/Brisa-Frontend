// D5: sin `opciones`, «Sí» y «No».
const SI_NO = Object.freeze([
  Object.freeze({ valor: true, etiqueta: 'Sí' }),
  Object.freeze({ valor: false, etiqueta: 'No' }),
]);

export const opcionesBooleano = ({ opciones }) =>
  opciones?.length ? opciones : SI_NO;

export const booleano = Object.freeze({
  textoRespuesta: (entrada, valor) =>
    opcionesBooleano(entrada).find((o) => o.valor === valor)?.etiqueta ??
    String(valor),
});
