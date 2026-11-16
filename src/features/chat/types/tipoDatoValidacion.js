// RF-25 (03-G): tipos de dato de una regla de validación (enum del backend).
export const TIPO_DATO_VALIDACION = Object.freeze({
  TEXTO: 'TEXTO',
  NUMERICO: 'NUMERICO',
  FECHA: 'FECHA',
  SELECCION: 'SELECCION',
});

export const TIPO_DATO_VALIDACION_ETIQUETA = Object.freeze({
  [TIPO_DATO_VALIDACION.TEXTO]: 'Texto',
  [TIPO_DATO_VALIDACION.NUMERICO]: 'Numérico',
  [TIPO_DATO_VALIDACION.FECHA]: 'Fecha',
  [TIPO_DATO_VALIDACION.SELECCION]: 'Selección',
});
