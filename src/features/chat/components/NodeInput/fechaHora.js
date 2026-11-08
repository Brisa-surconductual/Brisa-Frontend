import { FORMATO_FECHA } from '../../types/index.js';
import { capturadaEn } from '../../utils/capturadaEn.js';

// D4: FECHA "YYYY-MM-DD", HORA "HH:mm" y FECHA_HORA "YYYY-MM-DDTHH:mm:ss"
// con el desfase del dispositivo. min y max usan el mismo formato.
const PATRON = Object.freeze({
  FECHA: /^(\d{4})-(\d{2})-(\d{2})$/,
  HORA: /^(\d{2}):(\d{2})$/,
  FECHA_HORA:
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})[+-]\d{2}:\d{2}$/,
});

// Lo que entrega <input type="datetime-local">: sin desfase y a veces sin
// segundos.
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

// D6: se formatea en UTC con los componentes del texto: nunca
// new Date(texto), que lee "2026-10-07" como medianoche UTC (el 6 de
// octubre en Colombia). UTC tampoco tiene horas que no existen por cambio
// de horario.
const FORMATO = Object.freeze({
  FECHA: new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }),
  HORA: new Intl.DateTimeFormat('es-CO', {
    timeStyle: 'short',
    timeZone: 'UTC',
  }),
  FECHA_HORA: new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }),
});

// D3 (A-023, provisional): sin `formato`, o con uno desconocido, se usa
// FECHA_HORA.
export const formatoDe = ({ formato }) =>
  Object.hasOwn(FORMATO_FECHA, formato ?? '')
    ? formato
    : FORMATO_FECHA.FECHA_HORA;

// Date en UTC con los componentes del texto, o null si no cumple el
// formato o es imposible (ej. 2026-02-30 o 24:00).
const aFecha = (formato, valor) => {
  const partes = PATRON[formato].exec(valor)?.slice(1).map(Number);
  if (!partes) return null;
  const [anio, mes, dia, hora = 0, minuto = 0, segundo = 0] =
    formato === FORMATO_FECHA.HORA ? [2000, 1, 1, ...partes] : partes;
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, hora, minuto, segundo));
  const valida =
    hora < 24 &&
    minuto < 60 &&
    segundo < 60 &&
    // Date.UTC lleva los años 0-99 a 19xx: se rechazan.
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia;
  return valida ? fecha : null;
};

// D2: sin `validar`; lo que no se puede leer viaja tal cual y responde el
// backend.
export const fechaHora = Object.freeze({
  normalizar: (entrada, valor) => {
    if (!valor) return null;
    const partes =
      formatoDe(entrada) === FORMATO_FECHA.FECHA_HORA && LOCAL.exec(valor);
    if (!partes) return valor;
    const [anio, mes, dia, hora, minuto, segundo] = partes
      .slice(1)
      .map((parte) => Number(parte ?? 0));
    // D4: la hora local con el desfase del dispositivo en esa fecha
    // (respeta el horario de verano), con la utilidad de `capturadaEn`.
    return capturadaEn(new Date(anio, mes - 1, dia, hora, minuto, segundo));
  },

  textoRespuesta: (entrada, valor) => {
    const formato = formatoDe(entrada);
    const fecha = aFecha(formato, valor);
    return fecha ? FORMATO[formato].format(fecha) : valor;
  },
});

const legible = (formato, valor) => {
  const fecha = aFecha(formato, valor);
  if (!fecha) return null;
  const texto = FORMATO[formato].format(fecha);
  return formato === FORMATO_FECHA.HORA ? texto : `el ${texto}`;
};

// D5: pinta los límites; no valida.
export const ayudaFechaHora = (entrada) => {
  const formato = formatoDe(entrada);
  const { min, max } = entrada;
  const desde = min != null && legible(formato, min);
  const hasta = max != null && legible(formato, max);
  if (desde && hasta) return `Entre ${desde} y ${hasta}`;
  if (desde) return `Desde ${desde}`;
  if (hasta) return `Hasta ${hasta}`;
  return null;
};
