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

// PR4 (gestión de nodos): al GUARDAR `contenido.entrada.tipo` desde el
// admin hay que escribir el nombre de configuración, no el canónico —
// `PrepararEntradaNodoActualService` (backend) solo reconoce estos nombres
// exactos al armar la ficha que ve el estudiante. Es la dirección inversa
// de `ALIAS_TIPO_ENTRADA`. Los tipos que no están aquí se guardan igual.
export const TIPO_ENTRADA_CONFIGURACION = Object.freeze({
  [TIPO_ENTRADA.OPCION_UNICA]: 'SELECCION_UNICA',
  [TIPO_ENTRADA.MULTISELECCION]: 'SELECCION_MULTIPLE',
});

// Etiquetas para el selector del formulario administrativo. CONTINUAR no
// se ofrece: un nodo sin respuesta es simplemente no definir ninguna.
export const TIPO_ENTRADA_ETIQUETA = Object.freeze({
  [TIPO_ENTRADA.OPCION_UNICA]: 'Selección única',
  [TIPO_ENTRADA.MULTISELECCION]: 'Selección múltiple',
  [TIPO_ENTRADA.ESCALA]: 'Escala numérica',
  [TIPO_ENTRADA.NUMERICO]: 'Número',
  [TIPO_ENTRADA.FECHA_HORA]: 'Fecha u hora',
  [TIPO_ENTRADA.BOOLEANO]: 'Sí / No',
  [TIPO_ENTRADA.TEXTO_LIBRE]: 'Texto libre',
});

export const FORMATO_FECHA = Object.freeze({
  FECHA: 'FECHA',
  HORA: 'HORA',
  FECHA_HORA: 'FECHA_HORA',
});
