import {
  aplicarResultadoLote,
  listarColaSesion,
  obtenerSesionLocal,
} from '../../storage/index.js';
import {
  CONFIG_SINCRONIZACION,
  ESTADO_SINCRONIZACION_SESION,
} from '../../types/index.js';

import { ACCION_FALLO, clasificarFallo } from './fallosSincronizacion.js';
import { ARMADO_LOTE, construirLote } from './loteSincronizacion.js';
import { interpretarResultados } from './resultadoSincronizacion.js';

const {
  AL_DIA,
  PENDIENTE,
  REINTENTO_PROGRAMADO,
  INTERRUMPIDA,
  ESPERANDO_AUTENTICACION,
  PENDIENTE_DE_RESOLUCION,
  LOTE_INVALIDO,
  RESPUESTA_NO_VERIFICABLE,
} = ESTADO_SINCRONIZACION_SESION;

/*
 * Transporte: lo único que cambia entre el simulador de la demostración y
 * el servicio real (futuro `api/`, con `apiClient`).
 *
 *   sincronizar(idSesion, { interacciones }, { senal })
 *     → resuelve con el cuerpo 200 del contrato: { data: { resultados, … } }
 *     → rechaza con un error con `code` (y `backendMessage`), como
 *       `createChatApiError`; sin respuesta, code SIN_CONEXION.
 *   renovarCsrf({ senal })  (opcional) → renueva el token tras un 403.
 */

const resultado = (estado, extra = {}) => ({
  estado,
  pendientes: 0,
  conError: 0,
  error: null,
  reconciliacion: null,
  reintentar: false,
  falloDeRed: false,
  respondio: false,
  ...extra,
});

async function enviar(transporte, idSesion, interacciones, senal) {
  const cuerpo = { interacciones };

  try {
    return {
      respuesta: await transporte.sincronizar(idSesion, cuerpo, { senal }),
    };
  } catch (error) {
    if (
      clasificarFallo(error) !== ACCION_FALLO.RENOVAR_CSRF ||
      typeof transporte.renovarCsrf !== 'function'
    ) {
      return { error };
    }
  }

  // 403 CSRF_INVALIDO: se renueva el token y se reintenta UNA vez.
  try {
    await transporte.renovarCsrf({ senal });
    return {
      respuesta: await transporte.sincronizar(idSesion, cuerpo, { senal }),
    };
  } catch (error) {
    return { error, trasRenovar: true };
  }
}

const errorRegistrado = (error) => ({
  codigo: typeof error?.code === 'string' ? error.code : 'DESCONOCIDO',
  mensaje:
    typeof error?.backendMessage === 'string' && error.backendMessage
      ? error.backendMessage
      : null,
});

// Fallo del envío: nada se confirmó. Se registra el intento sin perder
// ninguna interacción; solo el 404 las marca como error.
async function tratarFallo({ envio, idUsuario, idSesion, ids, base }) {
  const error = errorRegistrado(envio.error);
  let accion = clasificarFallo(envio.error);

  // Un segundo 403 tras renovar no se renueva otra vez: backoff.
  if (accion === ACCION_FALLO.RENOVAR_CSRF) accion = ACCION_FALLO.REINTENTAR;

  if (accion === ACCION_FALLO.MARCAR_ERROR) {
    await aplicarResultadoLote(idUsuario, idSesion, {
      rechazadas: ids.map((id) => ({ id_interaccion: id, ...error })),
    });
    return resultado(PENDIENTE_DE_RESOLUCION, {
      ...base,
      pendientes: base.pendientes - ids.length,
      conError: base.conError + ids.length,
      error,
      respondio: true,
    });
  }

  await aplicarResultadoLote(idUsuario, idSesion, {
    intentadas: ids,
    ultimo_error: error,
  });

  switch (accion) {
    case ACCION_FALLO.NO_REINTENTAR:
      return resultado(LOTE_INVALIDO, { ...base, error, respondio: true });
    case ACCION_FALLO.ESPERAR_AUTENTICACION:
      return resultado(ESPERANDO_AUTENTICACION, {
        ...base,
        error,
        respondio: true,
      });
    case ACCION_FALLO.SIN_RESPUESTA:
      return resultado(INTERRUMPIDA, {
        ...base,
        error,
        reintentar: true,
        falloDeRed: true,
      });
    default:
      return resultado(REINTENTO_PROGRAMADO, {
        ...base,
        error,
        reintentar: true,
        respondio: true,
      });
  }
}

/*
 * Sincroniza las pendientes de UNA sesión del usuario: lote a lote, lee
 * siempre la cola de IndexedDB (la identidad de cada interacción es su
 * `id_interaccion`, también en los reintentos), envía y aplica los
 * resultados en una transacción. No decide cuándo reintentar: devuelve
 * el estado y el coordinador programa.
 *
 * `id_nodo_actual` del servidor solo se compara con el del dispositivo
 * (reconciliación): nunca lo sobrescribe ni lo hace retroceder.
 */
export async function sincronizarSesion({
  idSesion,
  idUsuario,
  transporte,
  senal,
  config = CONFIG_SINCRONIZACION,
}) {
  let reconciliacion = null;
  let respondio = false;
  let limite = Infinity;

  for (let vuelta = 0; ; vuelta += 1) {
    const [sesion, cola] = await Promise.all([
      obtenerSesionLocal(idSesion, idUsuario),
      listarColaSesion(idSesion, idUsuario),
    ]);
    const armado = construirLote({
      sesion,
      cola,
      tamanoMaximo: config.tamanoMaximoLote,
    });
    const base = {
      pendientes: armado.pendientes,
      conError: armado.conError,
      reconciliacion,
      respondio,
    };

    if (armado.tipo === ARMADO_LOTE.VACIO) {
      if (reconciliacion?.idNodoServidor) {
        base.reconciliacion = {
          ...reconciliacion,
          idNodoLocal: sesion?.id_nodo_actual ?? null,
          coincide: sesion?.id_nodo_actual === reconciliacion.idNodoServidor,
        };
      }
      return resultado(AL_DIA, base);
    }
    if (armado.tipo === ARMADO_LOTE.BLOQUEO) {
      return resultado(armado.estado, { ...base, error: armado.error ?? null });
    }

    // Tope de lotes por intento: cada lote confirmado acorta la cola; si
    // no, se deja para el siguiente disparo en lugar de girar sin fin.
    if (vuelta === 0) {
      limite = Math.ceil(armado.pendientes / config.tamanoMaximoLote) + 1;
    }
    if (vuelta >= limite) return resultado(PENDIENTE, base);

    const ids = armado.interacciones.map((i) => i.id_interaccion);
    const envio = await enviar(
      transporte,
      idSesion,
      armado.interacciones,
      senal,
    );

    if (envio.error) {
      // Motor detenido a mitad del envío: no se registra nada.
      if (senal?.aborted) {
        return resultado(INTERRUMPIDA, {
          ...base,
          reintentar: true,
          falloDeRed: true,
        });
      }
      return tratarFallo({ envio, idUsuario, idSesion, ids, base });
    }

    respondio = true;
    const plan = interpretarResultados(
      armado.interacciones,
      envio.respuesta?.data,
    );

    if (!plan.valido) {
      return resultado(RESPUESTA_NO_VERIFICABLE, {
        ...base,
        respondio,
        error: { codigo: plan.motivo, mensaje: null },
      });
    }

    await aplicarResultadoLote(idUsuario, idSesion, {
      confirmadas: plan.confirmadas,
      rechazadas: plan.rechazadas,
      intentadas: plan.pendientes,
    });
    reconciliacion = {
      idNodoServidor: plan.idNodoActual,
      estadoSesionServidor: plan.estadoSesion,
      idNodoLocal: null,
      coincide: null,
    };

    // Un rechazo se lee en la siguiente vuelta, ya desde la base.
    if (plan.rechazadas.length === 0 && plan.pendientes.length > 0) {
      return resultado(REINTENTO_PROGRAMADO, {
        ...base,
        pendientes: base.pendientes - plan.confirmadas.length,
        reconciliacion,
        respondio,
        reintentar: true,
      });
    }
  }
}
