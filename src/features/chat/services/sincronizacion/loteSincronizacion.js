import {
  CONFIG_SINCRONIZACION,
  ESTADO_SINCRONIZACION,
  ESTADO_SINCRONIZACION_SESION,
} from '../../types/index.js';

const { PENDIENTE_SINCRONIZACION, ERROR_SINCRONIZACION } =
  ESTADO_SINCRONIZACION;
const {
  PENDIENTE_DE_RESOLUCION,
  SECUENCIA_NO_DETERMINADA,
  SECUENCIA_INCONSISTENTE,
} = ESTADO_SINCRONIZACION_SESION;

export const ARMADO_LOTE = Object.freeze({
  LOTE: 'LOTE',
  VACIO: 'VACIO',
  BLOQUEO: 'BLOQUEO',
});

const esEnteroPositivo = (n) => Number.isInteger(n) && n >= 1;

// Ítem del lote con los campos del contrato y nada más. Nunca viaja
// `id_usuario`: el servidor lo toma de la autenticación.
export const aItemLote = (i) => ({
  id_interaccion: i.id_interaccion,
  id_nodo: i.id_nodo,
  secuencia: i.secuencia,
  tipo_entrada: i.tipo_entrada,
  valor: i.valor,
  timestamp_interaccion: i.timestamp_interaccion,
  estado_conectividad: i.estado_conectividad,
  recursos_no_presentados: [...i.recursos_no_presentados],
});

/*
 * Lote del contrato: de 1 a `tamanoMaximo` interacciones, en orden
 * ascendente de secuencia, sin huecos y con `id_interaccion` únicos. La
 * usa también el simulador para responder 400 LOTE_INVALIDO.
 */
export function esLoteValido(
  interacciones,
  tamanoMaximo = CONFIG_SINCRONIZACION.tamanoMaximoLote,
) {
  if (!Array.isArray(interacciones)) return false;
  if (interacciones.length < 1 || interacciones.length > tamanoMaximo) {
    return false;
  }

  const primera = interacciones[0]?.secuencia;
  const ids = new Set(interacciones.map((i) => i?.id_interaccion));

  return (
    esEnteroPositivo(primera) &&
    ids.size === interacciones.length &&
    interacciones.every((i, n) => i?.secuencia === primera + n)
  );
}

const bloqueo = (estado, extra = {}) => ({
  tipo: ARMADO_LOTE.BLOQUEO,
  estado,
  ...extra,
});

/*
 * Arma el siguiente lote de UNA sesión a partir de su sesión local y de su
 * cola completa (de un solo usuario). No supone que la primera secuencia
 * sea 1: el lote empieza en la pendiente más baja, sea cual sea. Lo que no
 * se puede verificar bloquea; no se inventa ni se reordena nada.
 */
export function construirLote({
  sesion,
  cola,
  tamanoMaximo = CONFIG_SINCRONIZACION.tamanoMaximoLote,
}) {
  const conError = cola.filter(
    (i) => i.estado_sincronizacion === ERROR_SINCRONIZACION,
  );
  const pendientes = cola
    .filter((i) => i.estado_sincronizacion === PENDIENTE_SINCRONIZACION)
    .sort((a, b) => a.secuencia - b.secuencia);
  const conteo = { pendientes: pendientes.length, conError: conError.length };

  // Tras un rechazo no se envía nada más de la sesión (D4): enviar las
  // siguientes produciría secuencias fuera de orden.
  if (conError.length > 0) {
    const primera = [...conError].sort((a, b) => a.secuencia - b.secuencia)[0];
    return bloqueo(PENDIENTE_DE_RESOLUCION, {
      ...conteo,
      error: primera.ultimo_error,
    });
  }

  if (pendientes.length === 0) return { tipo: ARMADO_LOTE.VACIO, ...conteo };

  if (!sesion || !Number.isInteger(sesion.ultima_secuencia)) {
    return bloqueo(SECUENCIA_NO_DETERMINADA, conteo);
  }

  const primera = pendientes[0].secuencia;
  const coherente =
    esEnteroPositivo(primera) &&
    pendientes.every(
      (i, n) =>
        i.secuencia === primera + n &&
        i.id_sesion === sesion.id_sesion &&
        i.id_usuario === sesion.id_usuario,
    ) &&
    pendientes.at(-1).secuencia <= sesion.ultima_secuencia;

  if (!coherente) return bloqueo(SECUENCIA_INCONSISTENTE, conteo);

  return {
    tipo: ARMADO_LOTE.LOTE,
    interacciones: pendientes.slice(0, tamanoMaximo).map(aItemLote),
    ...conteo,
  };
}
