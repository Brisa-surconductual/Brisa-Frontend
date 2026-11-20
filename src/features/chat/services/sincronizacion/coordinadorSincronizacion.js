import { listarSesionesEnCola } from '../../storage/index.js';
import {
  CONFIG_SINCRONIZACION,
  ESTADO_SINCRONIZACION_SESION,
  MOTIVO_SINCRONIZACION,
} from '../../types/index.js';

import { calcularEsperaMs } from './fallosSincronizacion.js';
import { sincronizarSesion } from './sincronizarSesion.js';

const {
  AL_DIA,
  SINCRONIZANDO,
  REINTENTO_PROGRAMADO,
  REINTENTOS_AGOTADOS,
  ESPERANDO_AUTENTICACION,
  LOTE_INVALIDO,
  RESPUESTA_NO_VERIFICABLE,
} = ESTADO_SINCRONIZACION_SESION;
const { INICIO_SESION, CONEXION, FOCO, PERIODICO, REINTENTO, MANUAL } =
  MOTIVO_SINCRONIZACION;

// Estos motivos no esperan el backoff y reinician la cuenta de fallos.
const PRIORITARIOS = new Set([INICIO_SESION, CONEXION, MANUAL]);
// Volver a enviar produciría el mismo lote o la misma respuesta.
const SOLO_MANUAL = new Set([LOTE_INVALIDO, RESPUESTA_NO_VERIFICABLE]);
// Si llegan varios disparos durante una ejecución, se repite una vez con
// el de mayor prioridad.
const PRIORIDAD = [MANUAL, INICIO_SESION, CONEXION, REINTENTO, FOCO, PERIODICO];

const relojGlobal = Object.freeze({
  ahora: () => Date.now(),
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id),
  setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
  clearInterval: (id) => globalThis.clearInterval(id),
});

const SESION_INICIAL = Object.freeze({
  estado: AL_DIA,
  pendientes: 0,
  conError: 0,
  error: null,
  reconciliacion: null,
  intentosFallidos: 0,
  proximoIntentoEn: null,
});

export const OCUPADA = Object.freeze({ ocupada: true });

// Una sola sincronización por sesión: en esta pestaña (conjunto en
// memoria) y, si el navegador tiene Web Locks, entre pestañas.
const enCurso = new Set();

async function conCandado(idSesion, trabajo) {
  if (enCurso.has(idSesion)) return OCUPADA;
  enCurso.add(idSesion);

  try {
    const locks = globalThis.navigator?.locks;

    if (typeof locks?.request === 'function') {
      return await locks.request(
        `brisa-chat-sync:${idSesion}`,
        { ifAvailable: true },
        (lock) => (lock ? trabajo() : OCUPADA),
      );
    }
    return await trabajo();
  } finally {
    enCurso.delete(idSesion);
  }
}

function puedeIntentar(sesion, motivo, ahora) {
  if (!sesion) return true;
  if (SOLO_MANUAL.has(sesion.estado)) return motivo === MANUAL;
  if (sesion.estado === ESPERANDO_AUTENTICACION) {
    return motivo === INICIO_SESION || motivo === MANUAL;
  }
  if (sesion.estado === REINTENTOS_AGOTADOS) return PRIORITARIOS.has(motivo);
  if (sesion.proximoIntentoEn !== null && sesion.proximoIntentoEn > ahora) {
    return PRIORITARIOS.has(motivo);
  }
  return true;
}

/*
 * Coordina la sincronización de las sesiones de UN usuario: atiende los
 * disparos (inicio de sesión, conexión, foco, cada `intervaloMs` y
 * reintentos), recorre las sesiones de una en una y programa el backoff.
 * Nunca hay dos ejecuciones a la vez: los disparos que llegan durante una
 * se agrupan en una sola repetición.
 *
 * Sin `transporte` no se crea: en producción no hay servicio todavía y
 * nada debe confirmar (ni borrar) interacciones reales.
 */
export function crearCoordinadorSincronizacion({
  idUsuario,
  transporte,
  conexionDisponible = () => true,
  alCambiar = () => {},
  alFalloDeRed = () => {},
  alRespuesta = () => {},
  config = {},
  reloj = relojGlobal,
  sincronizar = sincronizarSesion,
  listarSesiones = listarSesionesEnCola,
}) {
  if (!idUsuario || typeof transporte?.sincronizar !== 'function') {
    throw new Error('El coordinador necesita usuario y transporte.');
  }

  const cfg = { ...CONFIG_SINCRONIZACION, ...config };
  const sesiones = new Map();
  const temporizadores = new Map();
  let estado = Object.freeze({
    sincronizando: false,
    sinConexion: false,
    sesiones: Object.freeze({}),
  });
  let ejecucion = null;
  let repetir = null;
  let detenido = false;
  let intervalo = null;
  let controlador = new AbortController();

  function publicar(cambios = {}) {
    const lista = Object.freeze(Object.fromEntries(sesiones));

    estado = Object.freeze({
      ...estado,
      ...cambios,
      sincronizando: Object.values(lista).some(
        (s) => s.estado === SINCRONIZANDO,
      ),
      sesiones: lista,
    });
    if (!detenido) alCambiar(estado);
  }

  function fijar(idSesion, cambios) {
    const previo = sesiones.get(idSesion) ?? SESION_INICIAL;
    sesiones.set(idSesion, Object.freeze({ ...previo, ...cambios }));
  }

  function cancelarReintento(idSesion) {
    if (!temporizadores.has(idSesion)) return;
    reloj.clearTimeout(temporizadores.get(idSesion));
    temporizadores.delete(idSesion);
  }

  function programarReintento(idSesion, espera) {
    cancelarReintento(idSesion);
    temporizadores.set(
      idSesion,
      reloj.setTimeout(() => {
        temporizadores.delete(idSesion);
        solicitar(REINTENTO);
      }, espera),
    );
  }

  function aplicar(idSesion, r) {
    const previo = sesiones.get(idSesion) ?? SESION_INICIAL;

    if (r.falloDeRed) alFalloDeRed();
    else if (r.respondio) alRespuesta();

    const intentosFallidos = r.reintentar ? previo.intentosFallidos + 1 : 0;
    let siguiente = r.estado;
    let proximoIntentoEn = null;

    cancelarReintento(idSesion);
    if (r.reintentar) {
      if (intentosFallidos > cfg.maxReintentos) {
        siguiente = REINTENTOS_AGOTADOS;
      } else {
        const espera = calcularEsperaMs(intentosFallidos, cfg);
        proximoIntentoEn = reloj.ahora() + espera;
        programarReintento(idSesion, espera);
      }
    }

    fijar(idSesion, {
      estado: siguiente,
      pendientes: r.pendientes,
      conError: r.conError,
      error: r.error,
      reconciliacion: r.reconciliacion ?? previo.reconciliacion,
      intentosFallidos,
      proximoIntentoEn,
    });
  }

  async function sincronizarUna(idSesion, motivo) {
    if (PRIORITARIOS.has(motivo)) fijar(idSesion, { intentosFallidos: 0 });

    try {
      return await conCandado(idSesion, () => {
        fijar(idSesion, { estado: SINCRONIZANDO });
        publicar();
        return sincronizar({
          idSesion,
          idUsuario,
          transporte,
          senal: controlador.signal,
          config: cfg,
        });
      });
    } catch (error) {
      // Fallo del almacenamiento local: nada se borró; se reintenta.
      const previo = sesiones.get(idSesion) ?? SESION_INICIAL;
      return {
        estado: REINTENTO_PROGRAMADO,
        pendientes: previo.pendientes,
        conError: previo.conError,
        error: { codigo: error?.code ?? 'ALMACENAMIENTO', mensaje: null },
        reconciliacion: null,
        reintentar: true,
        falloDeRed: false,
        respondio: false,
      };
    }
  }

  async function ejecutar(motivo) {
    if (!conexionDisponible()) {
      publicar({ sinConexion: true });
      return;
    }
    publicar({ sinConexion: false });

    const ids = await listarSesiones(idUsuario);

    // Las que ya no tienen cola quedan al día (se conserva su
    // reconciliación).
    for (const [idSesion, s] of sesiones) {
      if (!ids.includes(idSesion) && s.estado !== AL_DIA) {
        cancelarReintento(idSesion);
        fijar(idSesion, {
          ...SESION_INICIAL,
          reconciliacion: s.reconciliacion,
        });
      }
    }

    for (const idSesion of ids) {
      if (detenido) return;
      if (!conexionDisponible()) {
        publicar({ sinConexion: true });
        return;
      }
      if (!puedeIntentar(sesiones.get(idSesion), motivo, reloj.ahora())) {
        continue;
      }

      const r = await sincronizarUna(idSesion, motivo);

      if (detenido) return;
      if (r !== OCUPADA) aplicar(idSesion, r);
      publicar();
    }
    publicar();
  }

  function solicitar(motivo) {
    if (detenido) return Promise.resolve(estado);

    if (ejecucion) {
      const actual = repetir ? PRIORIDAD.indexOf(repetir) : Infinity;
      if (PRIORIDAD.indexOf(motivo) < actual) repetir = motivo;
      return ejecucion;
    }

    ejecucion = ejecutar(motivo)
      .catch(() => {
        // Sin acceso a la cola: se vuelve a intentar en el próximo disparo.
      })
      .finally(() => {
        ejecucion = null;
        const siguiente = repetir;
        repetir = null;
        if (siguiente && !detenido) solicitar(siguiente);
      })
      .then(() => estado);

    return ejecucion;
  }

  return Object.freeze({
    // Primer disparo (tras el inicio de sesión) y sondeo periódico. El
    // sondeo solo envía si hay pendientes: sin cola no hace nada.
    iniciar() {
      if (detenido || intervalo !== null) return solicitar(INICIO_SESION);
      intervalo = reloj.setInterval(
        () => solicitar(PERIODICO),
        cfg.intervaloMs,
      );
      return solicitar(INICIO_SESION);
    },
    solicitar,
    // Se perdió la conexión: corta el envío en curso (sin respuesta).
    interrumpir() {
      controlador.abort();
      controlador = new AbortController();
    },
    // Al salir de la pantalla: corta el envío y limpia temporizadores.
    detener() {
      detenido = true;
      controlador.abort();
      for (const id of temporizadores.values()) reloj.clearTimeout(id);
      temporizadores.clear();
      if (intervalo !== null) reloj.clearInterval(intervalo);
      intervalo = null;
    },
    obtenerEstado: () => estado,
  });
}
