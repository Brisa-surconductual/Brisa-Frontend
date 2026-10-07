import { conComa } from './escala.js';

// Sin decimales: solo dígitos. Con decimales: la coma es el único
// separador. Así "1.000" (mil, en Colombia) da error en lugar de
// guardarse en silencio como 1.
const ENTERO = /^-?\d+$/;
const CON_COMA = /^-?\d+(,\d+)?$/;

export const numerico = Object.freeze({
  // El componente guarda el texto tal como se escribe; aquí se convierte.
  // Si no es un número válido se devuelve igual para que `validar` lo
  // rechace.
  normalizar: ({ decimales = 0 }, valor) => {
    const texto = (valor ?? '').trim();
    if (texto === '') return null;
    const patron = decimales > 0 ? CON_COMA : ENTERO;
    return patron.test(texto) ? Number(texto.replace(',', '.')) : texto;
  },

  // decimales = 0 si falta: el contrato dice "0 = entero".
  validar: ({ min, max, decimales = 0 }, valor) => {
    if (!Number.isFinite(valor)) return 'TIPO_DATO_INVALIDO';
    // toFixed y no String(valor): String(1e-7) es "1e-7".
    if (Number(valor.toFixed(decimales)) !== valor) return 'FORMATO_INVALIDO';
    if ((min != null && valor < min) || (max != null && valor > max)) {
      return 'FUERA_DE_RANGO';
    }
    return null;
  },

  textoRespuesta: ({ unidad }, valor) =>
    unidad ? `${conComa(valor)} ${unidad}` : conComa(valor),
});

const rango = (min, max) => {
  if (min != null && max != null)
    return `Entre ${conComa(min)} y ${conComa(max)}`;
  if (min != null) return `Mínimo ${conComa(min)}`;
  if (max != null) return `Máximo ${conComa(max)}`;
  return null;
};

export const ayudaNumerico = ({ min, max, decimales = 0 }) =>
  [rango(min, max), decimales > 0 && 'Usa coma para los decimales']
    .filter(Boolean)
    .join('. ') || null;
