import { conComa } from './escala.js';

// La coma es el único separador decimal: así "1.000" (mil, en Colombia)
// no se convierte en silencio en 1.
const NUMERO = /^-?\d+(,\d+)?$/;

const pasoEntero = (paso) => paso == null || Number.isInteger(paso);

export const numerico = Object.freeze({
  // D2: el componente guarda el texto tal como se escribe; aquí solo se
  // convierte. Lo que no se puede convertir se envía tal cual y el
  // backend responde. No se recorta al rango (CA-28-6).
  normalizar: (_entrada, valor) => {
    const texto = (valor ?? '').trim();
    if (texto === '') return null;
    // Muchos dígitos dan Infinity, que JSON envía como null: viaja el texto.
    const numero = Number(texto.replace(',', '.'));
    return NUMERO.test(texto) && Number.isFinite(numero) ? numero : texto;
  },

  textoRespuesta: (_entrada, valor) => conComa(valor),
});

const rango = (min, max) => {
  if (min != null && max != null)
    return `Entre ${conComa(min)} y ${conComa(max)}`;
  if (min != null) return `Mínimo ${conComa(min)}`;
  if (max != null) return `Máximo ${conComa(max)}`;
  return null;
};

// D3: pinta la configuración; no valida.
export const ayudaNumerico = ({ min, max, paso }) =>
  [rango(min, max), !pasoEntero(paso) && 'Usa coma para los decimales']
    .filter(Boolean)
    .join('. ') || null;

// Sin `paso` no se sabe si admite decimales: se ofrece el teclado con coma.
export const modoTeclado = ({ paso }) =>
  paso != null && Number.isInteger(paso) ? 'numeric' : 'decimal';
