// RF-25 (03-G, PR4): el administrativo (equipo de psicología) elige un
// formato de texto por nombre, nunca escribe una expresión regular a mano.
// `regex` es lo que viaja al backend como `formato_regex`; `null` significa
// que no se exige ningún formato particular (cualquier texto es válido).
export const FORMATO_TEXTO_PRESET = Object.freeze({
  CUALQUIERA: {
    label: 'Cualquier texto',
    regex: null,
  },
  SOLO_LETRAS: {
    label: 'Solo letras (sin números ni símbolos)',
    regex: '^[A-Za-zÁ-Úá-úÑñ\\s]+$',
  },
  SOLO_NUMEROS: {
    label: 'Solo números',
    regex: '^\\d+$',
  },
  LETRAS_Y_NUMEROS: {
    label: 'Letras y números (sin símbolos)',
    regex: '^[A-Za-z0-9Á-Úá-úÑñ\\s]+$',
  },
  CORREO: {
    label: 'Correo electrónico',
    regex: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
  },
});
