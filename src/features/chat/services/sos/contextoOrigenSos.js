import { MODULO_ORIGEN_SOS, SOS_PATH } from '../../types/sos.js';

/*
 * RF-43, ampliación B: de dónde salió el estudiante al oprimir el botón y
 * a dónde vuelve. Solo viajan el módulo y la ruta interna; el `estado` va
 * siempre en null: ninguna pantalla del estudiante expone hoy un estado
 * restaurable (borradores, paso, desplazamiento) y no se envían
 * respuestas, textos ni datos personales.
 */
const STUDENT_PREFIX = '/app/estudiante';
const CHAT_PREFIX = `${STUDENT_PREFIX}/chat`;
const CONTENIDO_PREFIX = `${STUDENT_PREFIX}/cronograma/contenido-vigente`;
const CRONOGRAMA_PREFIX = `${STUDENT_PREFIX}/cronograma`;
const DIARIO_PREFIX = `${STUDENT_PREFIX}/diario`;
const PERFIL_PREFIX = `${STUDENT_PREFIX}/perfil`;

// Límite del DTO del backend (`@MaxLength(512)`).
const MAX_RUTA = 512;

const dentroDe = (ruta, prefijo) =>
  ruta === prefijo ||
  ruta.startsWith(`${prefijo}/`) ||
  ruta.startsWith(`${prefijo}?`);

// Segmentos `.` o `..`, barras dobles o invertidas, fragmentos y
// caracteres de control: nada de eso es una ruta interna legítima.
// eslint-disable-next-line no-control-regex
const SOSPECHOSA = /\/\/|\\|#|[\u0000-\u001f\u007f]|(^|\/)\.{1,2}(\/|\?|$)/;

/*
 * Ruta interna del área del estudiante a la que se puede volver, o null.
 * Rechaza URL absolutas, `//host`, rutas de otras áreas y la propia
 * pantalla SOS (no se vuelve a abrir el ejercicio al salir de él).
 */
export function rutaRetornoSegura(ruta) {
  if (typeof ruta !== 'string' || ruta.length > MAX_RUTA) return null;
  if (!dentroDe(ruta, STUDENT_PREFIX) || SOSPECHOSA.test(ruta)) return null;
  if (dentroDe(ruta, SOS_PATH)) return null;

  return ruta;
}

export function moduloDeRuta(pathname) {
  if (dentroDe(pathname, CHAT_PREFIX)) return MODULO_ORIGEN_SOS.CHAT;
  if (dentroDe(pathname, CONTENIDO_PREFIX)) return MODULO_ORIGEN_SOS.CONTENIDO;
  if (dentroDe(pathname, CRONOGRAMA_PREFIX))
    return MODULO_ORIGEN_SOS.CRONOGRAMA;
  if (dentroDe(pathname, DIARIO_PREFIX)) return MODULO_ORIGEN_SOS.DIARIO;
  if (dentroDe(pathname, PERFIL_PREFIX)) return MODULO_ORIGEN_SOS.PERFIL;

  return MODULO_ORIGEN_SOS.OTRO;
}

/*
 * `contexto_origen` a partir de la ubicación de React Router. Solo la
 * ruta y la consulta (sin el fragmento). Fuera del área del estudiante o
 * con una ruta no válida no se envía contexto.
 */
export function crearContextoOrigen({ pathname, search = '' } = {}) {
  if (typeof pathname !== 'string') return null;

  const conConsulta = `${pathname}${search ?? ''}`;
  const ruta = rutaRetornoSegura(conConsulta) ?? rutaRetornoSegura(pathname);

  if (!ruta) return null;

  return Object.freeze({ modulo: moduloDeRuta(pathname), ruta, estado: null });
}

// Valida el contexto que devuelve el backend antes de usarlo para volver.
export function contextoRetornoSeguro(contexto) {
  if (!contexto || typeof contexto !== 'object') return null;
  if (!Object.values(MODULO_ORIGEN_SOS).includes(contexto.modulo)) return null;

  const ruta = rutaRetornoSegura(contexto.ruta);

  return ruta ? Object.freeze({ modulo: contexto.modulo, ruta }) : null;
}
