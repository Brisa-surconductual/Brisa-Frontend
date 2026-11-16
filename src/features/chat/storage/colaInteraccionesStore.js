import {
  CONECTIVIDAD_INTERACCION,
  ESTADO_SESION_OFFLINE,
  ESTADO_SINCRONIZACION,
} from '../types/estadosChat.js';
import { capturadaEn } from '../utils/capturadaEn.js';

import { ALMACEN, INDICE_COLA } from './brisaChatDb.js';
import {
  CHAT_STORAGE_ERROR,
  createChatStorageError,
} from './chatStorageError.js';
import { leerSesionPropia } from './sesionesLocalesStore.js';
import {
  ESCRITURA,
  LECTURA,
  ejecutarTransaccion,
  pedir,
} from './transaccion.js';
import {
  esDeCatalogo,
  esEnteroNoNegativo,
  esTexto,
  esUuid,
  exigir,
  exigirUsuario,
} from './validacionRegistro.js';

const { SESIONES_LOCALES, COLA_INTERACCIONES } = ALMACEN;
const { PENDIENTE_SINCRONIZACION } = ESTADO_SINCRONIZACION;

/*
 * Almacén `cola_interacciones` (clave `id_interaccion`): respuestas
 * guardadas en el dispositivo a la espera de sincronizarse. Se conserva
 * al cerrar sesión (D5) y solo se entrega a su usuario.
 *
 * `id_interaccion` es el identificador del contrato de sincronización;
 * no es el `idRespuesta` del envío en línea, aunque ambos sean UUID
 * generados en el dispositivo. Lo genera quien encola.
 */
function validarInteraccion(interaccion) {
  exigir(interaccion !== null && typeof interaccion === 'object');

  const {
    id_interaccion: idInteraccion,
    id_sesion: idSesion,
    id_usuario: idUsuario,
    id_nodo: idNodo,
    tipo_entrada: tipoEntrada,
    valor,
    timestamp_interaccion: timestamp,
    estado_conectividad: conectividad,
    recursos_no_presentados: noPresentados = [],
    id_nodo_destino_local: destino = null,
  } = interaccion;

  exigir(esUuid(idInteraccion));
  exigir(esTexto(idSesion));
  exigirUsuario(idUsuario);
  exigir(esTexto(idNodo));
  exigir(esTexto(tipoEntrada));
  exigir(valor !== undefined);
  exigir(esTexto(timestamp));
  exigir(esDeCatalogo(CONECTIVIDAD_INTERACCION, conectividad));
  exigir(Array.isArray(noPresentados) && noPresentados.every(esTexto));
  exigir(destino === null || esTexto(destino));

  return {
    idInteraccion,
    idSesion,
    idUsuario,
    idNodo,
    tipoEntrada,
    valor,
    timestamp,
    conectividad,
    noPresentados: [...noPresentados],
    destino,
  };
}

/*
 * Regla 3: encola la interacción y avanza `ultima_secuencia` en la misma
 * transacción. Resuelve con la interacción guardada solo cuando la
 * transacción terminó; si algo falla, ni la cola ni la sesión cambian
 * (tampoco el nodo actual).
 *
 * Con `id_nodo_destino_local`, el nodo actual pasa a ese destino en la
 * misma transacción. `estado_sesion_offline` (opcional) se aplica igual.
 */
export async function encolarInteraccion(
  interaccion,
  { ahora = new Date(), estado_sesion_offline: estadoNuevo } = {},
) {
  const datos = validarInteraccion(interaccion);

  exigir(
    estadoNuevo === undefined ||
      esDeCatalogo(ESTADO_SESION_OFFLINE, estadoNuevo),
  );

  return ejecutarTransaccion(
    [SESIONES_LOCALES, COLA_INTERACCIONES],
    ESCRITURA,
    async (tx) => {
      const sesiones = tx.objectStore(SESIONES_LOCALES);
      const sesion = await leerSesionPropia(
        sesiones,
        datos.idSesion,
        datos.idUsuario,
      );

      if (sesion.estado_sesion_offline === ESTADO_SESION_OFFLINE.COMPLETADA) {
        throw createChatStorageError(
          CHAT_STORAGE_ERROR.SESION_LOCAL_COMPLETADA,
        );
      }
      if (!esEnteroNoNegativo(sesion.ultima_secuencia)) {
        throw createChatStorageError(
          CHAT_STORAGE_ERROR.SECUENCIA_NO_DETERMINADA,
        );
      }

      const registro = {
        id_interaccion: datos.idInteraccion,
        id_usuario: datos.idUsuario,
        id_sesion: datos.idSesion,
        id_nodo: datos.idNodo,
        secuencia: sesion.ultima_secuencia + 1,
        tipo_entrada: datos.tipoEntrada,
        valor: datos.valor,
        timestamp_interaccion: datos.timestamp,
        estado_conectividad: datos.conectividad,
        recursos_no_presentados: datos.noPresentados,
        id_nodo_destino_local: datos.destino,
        estado_sincronizacion: PENDIENTE_SINCRONIZACION,
        intentos: 0,
        ultimo_error: null,
      };

      // `add`, no `put`: una clave o secuencia ocupada aborta todo.
      await pedir(tx.objectStore(COLA_INTERACCIONES).add(registro));
      await pedir(
        sesiones.put({
          ...sesion,
          ultima_secuencia: registro.secuencia,
          id_nodo_actual: datos.destino ?? sesion.id_nodo_actual,
          estado_sesion_offline: estadoNuevo ?? sesion.estado_sesion_offline,
          actualizado_en: capturadaEn(ahora),
        }),
      );

      return registro;
    },
  );
}

// Toda la cola de una sesión del usuario, por secuencia ascendente.
export async function listarColaSesion(idSesion, idUsuario) {
  exigir(esTexto(idSesion));
  exigirUsuario(idUsuario);

  const rango = IDBKeyRange.bound(
    [idSesion, 0],
    [idSesion, Number.MAX_SAFE_INTEGER],
  );
  const interacciones = await ejecutarTransaccion(
    [COLA_INTERACCIONES],
    LECTURA,
    (tx) =>
      pedir(
        tx
          .objectStore(COLA_INTERACCIONES)
          .index(INDICE_COLA.SESION_SECUENCIA)
          .getAll(rango),
      ),
  );

  return interacciones.filter((i) => i.id_usuario === idUsuario);
}

// Pendientes de sincronizar de una sesión, en orden de secuencia.
export async function listarPendientesSesion(idSesion, idUsuario) {
  const cola = await listarColaSesion(idSesion, idUsuario);
  return cola.filter(
    (i) => i.estado_sincronizacion === PENDIENTE_SINCRONIZACION,
  );
}

// Regla 1: con pendientes, toda respuesta nueva de la sesión se encola.
export async function tienePendientes(idSesion, idUsuario) {
  return (await listarPendientesSesion(idSesion, idUsuario)).length > 0;
}

// Sesiones del usuario con interacciones pendientes de sincronizar.
export async function listarSesionesConPendientes(idUsuario) {
  exigirUsuario(idUsuario);

  const delUsuario = await ejecutarTransaccion(
    [COLA_INTERACCIONES],
    LECTURA,
    (tx) =>
      pedir(
        tx
          .objectStore(COLA_INTERACCIONES)
          .index(INDICE_COLA.USUARIO)
          .getAll(idUsuario),
      ),
  );

  return [
    ...new Set(
      delUsuario
        .filter((i) => i.estado_sincronizacion === PENDIENTE_SINCRONIZACION)
        .map((i) => i.id_sesion),
    ),
  ];
}

const errorValido = (error) =>
  error === null ||
  (error !== null &&
    typeof error === 'object' &&
    (error.codigo === null || typeof error.codigo === 'string') &&
    (error.mensaje === null || typeof error.mensaje === 'string'));

/*
 * Cambia el estado de sincronización de una interacción del usuario.
 * `ultimo_error` es `{ codigo, mensaje }` o null; `incrementarIntentos`
 * suma un intento. La secuencia y la respuesta no se modifican.
 */
export async function actualizarEstadoSincronizacion(
  idInteraccion,
  idUsuario,
  { estado, ultimo_error: ultimoError = null, incrementarIntentos = false },
) {
  exigir(esUuid(idInteraccion));
  exigirUsuario(idUsuario);
  exigir(esDeCatalogo(ESTADO_SINCRONIZACION, estado));
  exigir(errorValido(ultimoError));

  return ejecutarTransaccion([COLA_INTERACCIONES], ESCRITURA, async (tx) => {
    const cola = tx.objectStore(COLA_INTERACCIONES);
    const interaccion = await pedir(cola.get(idInteraccion));

    if (!interaccion) {
      throw createChatStorageError(CHAT_STORAGE_ERROR.DATOS_INVALIDOS);
    }
    if (interaccion.id_usuario !== idUsuario) {
      throw createChatStorageError(CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE);
    }

    const registro = {
      ...interaccion,
      estado_sincronizacion: estado,
      ultimo_error:
        ultimoError === null
          ? null
          : { codigo: ultimoError.codigo, mensaje: ultimoError.mensaje },
      intentos: interaccion.intentos + (incrementarIntentos ? 1 : 0),
    };

    await pedir(cola.put(registro));
    return registro;
  });
}

/*
 * Borra de la cola las interacciones ya confirmadas por el servidor
 * (SINCRONIZADA o DUPLICADA), en una sola transacción. Una que ya no
 * está se ignora (idempotente); una de otro usuario aborta todo.
 * Devuelve cuántas se borraron.
 */
export async function eliminarInteraccionesConfirmadas(
  idUsuario,
  idsInteraccion,
) {
  exigirUsuario(idUsuario);
  exigir(Array.isArray(idsInteraccion) && idsInteraccion.every(esUuid));

  return ejecutarTransaccion([COLA_INTERACCIONES], ESCRITURA, async (tx) => {
    const cola = tx.objectStore(COLA_INTERACCIONES);
    let borradas = 0;

    for (const id of new Set(idsInteraccion)) {
      const interaccion = await pedir(cola.get(id));

      if (!interaccion) continue;
      if (interaccion.id_usuario !== idUsuario) {
        throw createChatStorageError(CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE);
      }

      await pedir(cola.delete(id));
      borradas += 1;
    }

    return borradas;
  });
}
