// Los únicos códigos que genera el cliente (D2); el resto viene del backend.
export const API_ERROR_CLIENTE = Object.freeze({
  SIN_CONEXION: 'SIN_CONEXION',
  DESCONOCIDO: 'DESCONOCIDO',
});

const NORMALIZADO = Symbol('apiError');

// Ojo: la marca no es enumerable y se pierde si el objeto se copia con spread.
const crear = (campos) =>
  Object.freeze(Object.defineProperty(campos, NORMALIZADO, { value: true }));

const texto = (valor) => (typeof valor === 'string' ? valor : null);

function leerMensaje(data) {
  if (typeof data.mensaje === 'string') return data.mensaje;
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.message)) return data.message.join(' ');
  return '';
}

// RF-37: identificador de correlación. El que devolvió el servidor o, si
// no hubo respuesta, el que envió la petición. Solo se agrega si existe:
// los módulos que no lo usan conservan la forma de D4.
function leerIdPeticion(error) {
  const id =
    error?.response?.headers?.['x-request-id'] ??
    error?.config?.headers?.['X-Request-Id'];

  return typeof id === 'string' && id !== '' ? { requestId: id } : {};
}

// Presenta el error que decidió el backend (D1, D4); no inventa mensajes.
export function toApiError(error) {
  if (error?.[NORMALIZADO]) return error;

  const response = error?.response;

  if (!response) {
    return crear({
      status: null,
      codigo: API_ERROR_CLIENTE.SIN_CONEXION,
      mensaje: '',
      campo: null,
      reintentable: true,
      ...leerIdPeticion(error),
    });
  }

  const status = response.status ?? null;
  const data =
    response.data && typeof response.data === 'object' ? response.data : {};

  return crear({
    status,
    codigo: texto(data.codigo) ?? API_ERROR_CLIENTE.DESCONOCIDO,
    mensaje: leerMensaje(data),
    campo: texto(data.campo),
    reintentable: status >= 500,
    ...leerIdPeticion(error),
  });
}

// Un error ya normalizado por `toApiError` (marca no enumerable).
export const esApiErrorNormalizado = (error) => Boolean(error?.[NORMALIZADO]);
