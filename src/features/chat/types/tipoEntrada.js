// Nombres canónicos (A-014): los que acepta POST /respuestas (RF-27 v1.1).
// CONTINUAR es el acuse de lectura de un nodo informativo.
export const TIPO_ENTRADA = Object.freeze({
  OPCION_UNICA: 'OPCION_UNICA',
  MULTISELECCION: 'MULTISELECCION',
  ESCALA: 'ESCALA',
  NUMERICO: 'NUMERICO',
  FECHA_HORA: 'FECHA_HORA',
  BOOLEANO: 'BOOLEANO',
  TEXTO_LIBRE: 'TEXTO_LIBRE',
  CONTINUAR: 'CONTINUAR',
});

// A-014 (provisional): el GET de nodo actual aún entrega los nombres de
// configuración. Es la misma tabla que usa el backend; se retira cuando
// el GET devuelva los canónicos.
export const ALIAS_TIPO_ENTRADA = Object.freeze({
  SELECCION_UNICA: TIPO_ENTRADA.OPCION_UNICA,
  SELECCION_MULTIPLE: TIPO_ENTRADA.MULTISELECCION,
});

export const FORMATO_FECHA = Object.freeze({
  FECHA: 'FECHA',
  HORA: 'HORA',
  FECHA_HORA: 'FECHA_HORA',
});
