import {
  aNodoInterfaz,
  buscarNodoPaquete,
} from '../../../services/offline/nodoPaquete.js';
import {
  CHAT_STORAGE_ERROR,
  encolarInteraccion,
  esChatStorageError,
  listarPendientesSesion,
  obtenerPaquete,
  obtenerRecurso,
  obtenerSesionLocal,
} from '../../../storage/index.js';
import {
  BLOQUEO_OFFLINE,
  ESTADO_SESION_OFFLINE,
} from '../../../types/index.js';
import { capturadaEn } from '../../../utils/capturadaEn.js';
import { nuevoUuid } from '../../../utils/nuevoUuid.js';

/*
 * Acceso de la conversación sin conexión a la base local. Todo pasa por
 * el usuario autenticado: un paquete o una sesión de otro usuario no
 * existen para esta pantalla.
 */
export class BloqueoOffline extends Error {
  constructor(codigo) {
    super(codigo);
    this.name = 'BloqueoOffline';
    this.codigo = codigo;
  }
}

// Solo se consultan los recursos que referencia el nodo del paquete del
// usuario; nunca identificadores ajenos al paquete autorizado.
async function recursosFaltantes(idsRecurso) {
  const faltantes = [];

  for (const id of idsRecurso) {
    if ((await obtenerRecurso(id)) === null) faltantes.push(id);
  }

  return Object.freeze(faltantes);
}

// Nodo listo para la interfaz, con los recursos que no están en el
// dispositivo (van a `recursos_no_presentados` al responder).
export async function prepararNodo(paquete, idNodo) {
  const nodoPaquete = buscarNodoPaquete(paquete, idNodo);
  if (!nodoPaquete) throw new BloqueoOffline(BLOQUEO_OFFLINE.NODO_AUSENTE);

  const { nodo, idsRecurso, otrosNoPresentables } = aNodoInterfaz(nodoPaquete);

  return Object.freeze({
    nodo,
    recursosNoPresentados: await recursosFaltantes(idsRecurso),
    otrosNoPresentables,
  });
}

function bloqueoDeAlmacenamiento(error) {
  if (!esChatStorageError(error)) return null;

  switch (error.code) {
    case CHAT_STORAGE_ERROR.ALMACENAMIENTO_NO_DISPONIBLE:
      return BLOQUEO_OFFLINE.ALMACENAMIENTO_NO_DISPONIBLE;
    case CHAT_STORAGE_ERROR.SECUENCIA_NO_DETERMINADA:
      return BLOQUEO_OFFLINE.SECUENCIA_NO_DETERMINADA;
    case CHAT_STORAGE_ERROR.SESION_LOCAL_NO_ENCONTRADA:
    case CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE:
      return BLOQUEO_OFFLINE.SIN_PAQUETE;
    default:
      return null;
  }
}

// Convierte un error de la base en bloqueo cuando no tiene arreglo
// reintentando; lo demás se propaga tal cual.
export function comoBloqueo(error) {
  const codigo = bloqueoDeAlmacenamiento(error);
  return codigo ? new BloqueoOffline(codigo) : error;
}

// Reapertura (dentro de la aplicación cargada): retoma el nodo guardado
// en `sesiones_locales` con el paquete del mismo usuario.
export async function cargarConversacionOffline(idSesion, idUsuario) {
  try {
    const sesion = await obtenerSesionLocal(idSesion, idUsuario);
    if (!sesion) throw new BloqueoOffline(BLOQUEO_OFFLINE.SIN_PAQUETE);

    const paquete = await obtenerPaquete(idSesion, idUsuario);
    if (!paquete) throw new BloqueoOffline(BLOQUEO_OFFLINE.SIN_PAQUETE);

    const actual = await prepararNodo(paquete, sesion.id_nodo_actual);
    const pendientes = await listarPendientesSesion(idSesion, idUsuario);

    return Object.freeze({
      paquete,
      actual,
      pendientes: pendientes.length,
      completada:
        sesion.estado_sesion_offline === ESTADO_SESION_OFFLINE.COMPLETADA,
    });
  } catch (error) {
    throw comoBloqueo(error);
  }
}

/*
 * Regla 3: guarda la respuesta ya decidida por el motor y avanza la
 * sesión en una sola transacción (encolarInteraccion). Si la escritura
 * falla, la promesa se rechaza y el nodo actual no cambia.
 */
export async function guardarRespuestaOffline({
  idSesion,
  idUsuario,
  idNodo,
  decision,
  recursosNoPresentados,
  conectividad,
  ahora = new Date(),
}) {
  try {
    return await encolarInteraccion(
      {
        id_interaccion: nuevoUuid(),
        id_usuario: idUsuario,
        id_sesion: idSesion,
        id_nodo: idNodo,
        tipo_entrada: decision.tipoEntrada,
        valor: decision.valor,
        timestamp_interaccion: capturadaEn(ahora),
        estado_conectividad: conectividad,
        recursos_no_presentados: [...recursosNoPresentados],
        id_nodo_destino_local: decision.idNodoDestino,
      },
      decision.destinoTerminal
        ? { ahora, estado_sesion_offline: ESTADO_SESION_OFFLINE.COMPLETADA }
        : { ahora },
    );
  } catch (error) {
    throw comoBloqueo(error);
  }
}
