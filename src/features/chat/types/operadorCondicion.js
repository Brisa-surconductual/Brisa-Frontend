// RF-25: operadores de condición de una transición (enum del backend).
export const OPERADOR_CONDICION = Object.freeze({
  IGUALDAD: 'IGUALDAD',
  RANGO: 'RANGO',
  CATEGORIA: 'CATEGORIA',
});

export const OPERADOR_CONDICION_ETIQUETA = Object.freeze({
  [OPERADOR_CONDICION.IGUALDAD]: 'Igualdad',
  [OPERADOR_CONDICION.RANGO]: 'Rango',
  [OPERADOR_CONDICION.CATEGORIA]: 'Categoría',
});
