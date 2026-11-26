// RF-25: operadores de condición de una transición (enum del backend).
export const OPERADOR_CONDICION = Object.freeze({
  IGUALDAD: 'IGUALDAD',
  RANGO: 'RANGO',
  CATEGORIA: 'CATEGORIA',
  // RF-25: transición "cualquier otra respuesta".
  SIEMPRE: 'SIEMPRE',
});

export const OPERADOR_CONDICION_ETIQUETA = Object.freeze({
  [OPERADOR_CONDICION.IGUALDAD]: 'Igualdad',
  [OPERADOR_CONDICION.RANGO]: 'Rango',
  [OPERADOR_CONDICION.CATEGORIA]: 'Categoría',
  [OPERADOR_CONDICION.SIEMPRE]: 'Cualquier otra respuesta',
});
