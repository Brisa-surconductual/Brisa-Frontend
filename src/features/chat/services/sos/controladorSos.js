import { CHAT_CLIENT_ERROR } from '../../api/chatApiUtils.js';
import { activarSos } from '../../api/sos/activarSos.js';
import { finalizarSos } from '../../api/sos/finalizarSos.js';
import { enviarRespuesta } from '../../api/sesion/enviarRespuesta.js';
import { obtenerNodoActual } from '../../api/sesion/obtenerNodoActual.js';
// RF-30: el cuerpo de la respuesta es el mismo de la conversación
// (id_interaccion, secuencia, tipo_entrada, valor, hora y conectividad).
import { crearCuerpo } from '../../pages/ChatConversationPage/utils/envio.js';
import { ESTADO_SESION } from '../../types/estadosChat.js';
import {
  ACCION_ERROR_ENVIO_SOS,
  CODIGO_ERROR_SOS,
  FASE_SOS,
  MOTIVO_FINALIZACION_SOS,
} from '../../types/sos.js';
import { mapNodoActual } from '../nodoActual.js';
import { mapResultadoRespuesta } from '../resultadoRespuesta.js';

import { MARCA_SOS, MEDIDA_SOS, marcarSos } from './medicionSos.js';
import { mapActivacionSos, mapFinalizacionSos } from './respuestaSos.js';
import {
  RELOJ_NAVEGADOR,
  crearLimite,
  leerReloj,
  restanteMs,
} from './tiempoSos.js';

const API_SOS = Object.freeze({
  activarSos,
  finalizarSos,
  enviarRespuesta,
  obtenerNodoActual,
});

const {
  ACTIVANDO,
  ERROR_ACTIVACION,
  EN_CURSO,
  FINALIZANDO,
  ERROR_FINALIZACION,
  FINALIZADA,
} = FASE_SOS;

// Mientras la intervención no termine, otro toque no activa otra.
const FASES_EN_CURSO = Object.freeze([
  ACTIVANDO,
  EN_CURSO,
  FINALIZANDO,
  ERROR_FINALIZACION,
]);

// Error del cliente con la forma de `toApiError` (D4) para ApiErrorMessage.
const ERROR_RESPUESTA_INVALIDA = Object.freeze({
  status: null,
  codigo: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
  mensaje: '',
  campo: null,
  reintentable: false,
});

const esNoAutenticado = (error) => error?.status === 401;

export const ESTADO_INICIAL_SOS = Object.freeze({
  fase: ACTIVANDO,
  intervencion: null,
  restanteMs: null,
  nodo: null,
  // RF-30: última secuencia confirmada de la sesión SOS (nueva: 0).
  secuencia: 0,
  enviando: false,
  envio: null,
  errorEnvio: null,
  accionErrorEnvio: null,
  cargandoNodo: false,
  errorNodo: null,
  motivo: null,
  resultado: null,
  // El backend ya había cerrado la intervención: no se conoce su estado.
  estadoDesconocido: false,
  error: null,
  requiereLogin: false,
  medicion: Object.freeze({ interfazMs: null, nodoMs: null }),
});

/*
 * RF-43: una intervención SOS, sin React. La pantalla se suscribe y llama a
 * sus acciones; la API y el reloj se inyectan para probarla.
 *
 * - `activar` hace un único POST /chat/sos/activar.
 * - Las respuestas van por RF-30 a la sesión SOS; tras cada una se pide el
 *   nodo actual (RF-26).
 * - Al llegar al nodo final se pide el cierre COMPLETADA; el backend decide
 *   si queda COMPLETA o INCOMPLETA.
 * - `tick` recalcula el tiempo con el límite del servidor y, al agotarse,
 *   pide el cierre TIEMPO_AGOTADO.
 * - Una respuesta que llega cuando la intervención ya no está en curso se
 *   descarta (respuesta tardía).
 */
export function crearControladorSos({
  contexto = null,
  toque = null,
  api = API_SOS,
  reloj = RELOJ_NAVEGADOR,
} = {}) {
  let estado = ESTADO_INICIAL_SOS;
  let limite = null;
  let activando = false;
  let finalizando = false;
  // RF-29: el backend confirmó que la última respuesta llegó al nodo final.
  let llegoAlFinal = false;
  let descartado = false;
  const oyentes = new Set();

  function fijar(cambios) {
    if (descartado) return;
    estado = Object.freeze({ ...estado, ...cambios });
    for (const oyente of oyentes) oyente();
  }

  const restante = () => (limite ? restanteMs(limite, leerReloj(reloj)) : null);
  const enCurso = () => estado.fase === EN_CURSO && !descartado;

  async function activar() {
    if (activando || estado.fase !== ACTIVANDO) return;

    activando = true;
    // La cuenta se ancla al envío (ver tiempoSos.js).
    const anclaje = leerReloj(reloj);
    let data;

    try {
      data = await api.activarSos(contexto);
    } catch (error) {
      activando = false;
      fijar({
        fase: ERROR_ACTIVACION,
        error,
        requiereLogin: esNoAutenticado(error),
      });
      return;
    }

    activando = false;
    const modelo = mapActivacionSos(data);

    if (!modelo) {
      fijar({ fase: ERROR_ACTIVACION, error: ERROR_RESPUESTA_INVALIDA });
      return;
    }

    limite = crearLimite(modelo.duracionMs, anclaje);
    marcarSos(MARCA_SOS.NODO, MEDIDA_SOS.TOQUE_A_NODO);
    fijar({
      fase: EN_CURSO,
      intervencion: Object.freeze({
        idIntervencion: modelo.idIntervencion,
        idSesionSos: modelo.idSesionSos,
        sesionPausada: modelo.sesionPausada,
        recursos: modelo.recursos,
      }),
      nodo: modelo.nodo,
      restanteMs: restante(),
      medicion: Object.freeze({
        ...estado.medicion,
        nodoMs: toque === null ? null : reloj.mono() - toque,
      }),
    });

    if (restante() <= 0) {
      void finalizar(MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO);
    } else if (modelo.nodo.esTerminal) {
      void finalizar(MOTIVO_FINALIZACION_SOS.COMPLETADA);
    }
  }

  function reintentarActivacion() {
    if (
      estado.fase !== ERROR_ACTIVACION ||
      estado.error?.reintentable !== true
    ) {
      return;
    }

    fijar({ fase: ACTIVANDO, error: null });
    void activar();
  }

  async function finalizar(motivo) {
    if (finalizando || !estado.intervencion) return;
    if (![EN_CURSO, ERROR_FINALIZACION].includes(estado.fase)) return;

    finalizando = true;
    fijar({
      fase: FINALIZANDO,
      motivo,
      error: null,
      enviando: false,
      cargandoNodo: false,
      restanteMs: restante(),
    });

    let data;

    try {
      data = await api.finalizarSos(estado.intervencion.idIntervencion, motivo);
    } catch (error) {
      finalizando = false;
      manejarErrorFinalizacion(error);
      return;
    }

    finalizando = false;
    const resultado = mapFinalizacionSos(data);

    fijar(
      resultado
        ? { fase: FINALIZADA, resultado }
        : {
            fase: FINALIZADA,
            estadoDesconocido: true,
            error: ERROR_RESPUESTA_INVALIDA,
          },
    );
  }

  function manejarErrorFinalizacion(error) {
    if (esNoAutenticado(error)) {
      fijar({ fase: ERROR_FINALIZACION, error, requiereLogin: true });
      return;
    }

    // Ya estaba cerrada (otra pestaña, el cierre automático del backend o
    // un reintento cuyo primer intento sí llegó): el estado final no se
    // conoce y no se inventa.
    if (
      error?.codigo === CODIGO_ERROR_SOS.INTERVENCION_FINALIZADA ||
      error?.codigo === CODIGO_ERROR_SOS.INTERVENCION_NO_ENCONTRADA
    ) {
      fijar({ fase: FINALIZADA, estadoDesconocido: true, error });
      return;
    }

    fijar({ fase: ERROR_FINALIZACION, error });
  }

  function reintentarFinalizacion() {
    if (estado.fase === ERROR_FINALIZACION) void finalizar(estado.motivo);
  }

  function cerrar() {
    if (estado.fase === EN_CURSO) {
      void finalizar(MOTIVO_FINALIZACION_SOS.CERRADA_POR_USUARIO);
    }
  }

  function tick() {
    if (!enCurso() || !limite) return;

    const ms = restante();

    if (ms <= 0) {
      void finalizar(MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO);
    } else if (ms !== estado.restanteMs) {
      fijar({ restanteMs: ms });
    }
  }

  async function cargarNodo() {
    fijar({ cargandoNodo: true, errorNodo: null });

    let data;

    try {
      data = await api.obtenerNodoActual(estado.intervencion.idSesionSos);
    } catch (error) {
      if (!enCurso()) return;
      if (esNoAutenticado(error)) {
        fijar({ cargandoNodo: false, requiereLogin: true });
        return;
      }
      fijar({ cargandoNodo: false, errorNodo: error });
      // El servidor ya registró la llegada al final: se cierra aunque el
      // último mensaje no se pueda mostrar.
      if (llegoAlFinal) void finalizar(MOTIVO_FINALIZACION_SOS.COMPLETADA);
      return;
    }

    if (!enCurso()) return;

    const modelo = mapNodoActual(data);

    fijar({ cargandoNodo: false, nodo: modelo.nodo });

    if (
      llegoAlFinal ||
      modelo.nodo.esTerminal ||
      modelo.estadoSesion === ESTADO_SESION.COMPLETADA
    ) {
      void finalizar(MOTIVO_FINALIZACION_SOS.COMPLETADA);
    }
  }

  function reintentarNodo() {
    if (enCurso() && estado.errorNodo && !estado.cargandoNodo)
      void cargarNodo();
  }

  function manejarErrorEnvio(error) {
    if (esNoAutenticado(error)) {
      fijar({ enviando: false, requiereLogin: true });
      return;
    }

    // El servidor dice que se agotó el tiempo (su reloj manda).
    if (error?.codigo === CODIGO_ERROR_SOS.TIEMPO_AGOTADO) {
      fijar({ enviando: false, envio: null });
      void finalizar(MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO);
      return;
    }

    if (error?.codigo === CODIGO_ERROR_SOS.INTERVENCION_FINALIZADA) {
      fijar({
        fase: FINALIZADA,
        enviando: false,
        envio: null,
        estadoDesconocido: true,
        error,
      });
      return;
    }

    if (error?.status === 400) {
      // Otra respuesta será otra interacción (id_interaccion nuevo).
      fijar({
        enviando: false,
        envio: null,
        errorEnvio: error,
        accionErrorEnvio: ACCION_ERROR_ENVIO_SOS.INLINE,
      });
      return;
    }

    fijar({
      enviando: false,
      errorEnvio: error,
      accionErrorEnvio:
        error?.reintentable === true
          ? ACCION_ERROR_ENVIO_SOS.REINTENTAR
          : ACCION_ERROR_ENVIO_SOS.BLOQUEADO,
    });
  }

  async function enviar(cuerpo) {
    fijar({
      enviando: true,
      envio: cuerpo,
      errorEnvio: null,
      accionErrorEnvio: null,
    });

    let data;

    try {
      data = await api.enviarRespuesta(estado.intervencion.idSesionSos, cuerpo);
    } catch (error) {
      if (enCurso()) manejarErrorEnvio(error);
      return;
    }

    // Respuesta tardía: la intervención se cerró mientras viajaba.
    if (!enCurso()) return;

    const resultado = mapResultadoRespuesta(data);

    llegoAlFinal = resultado.estadoSesion === ESTADO_SESION.COMPLETADA;
    fijar({
      enviando: false,
      envio: null,
      secuencia: resultado.secuencia ?? cuerpo.secuencia,
    });
    await cargarNodo();
  }

  function puedeResponder() {
    return (
      enCurso() &&
      !estado.enviando &&
      !estado.cargandoNodo &&
      // Tras un fallo al pedir el nodo, el que se ve ya no es el vigente.
      !estado.errorNodo &&
      estado.nodo !== null &&
      !estado.nodo.esTerminal &&
      estado.accionErrorEnvio !== ACCION_ERROR_ENVIO_SOS.BLOQUEADO
    );
  }

  // Sin respuestas después del límite: si ya no queda tiempo se cierra.
  function responder({ valor } = {}) {
    if (!puedeResponder()) return;
    if (restante() <= 0) {
      void finalizar(MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO);
      return;
    }

    void enviar(
      crearCuerpo(estado.nodo, valor, { secuencia: estado.secuencia + 1 }),
    );
  }

  // D7: el reintento reenvía el mismo cuerpo (mismo id_interaccion).
  function reintentarEnvio() {
    if (
      !enCurso() ||
      estado.enviando ||
      estado.accionErrorEnvio !== ACCION_ERROR_ENVIO_SOS.REINTENTAR ||
      !estado.envio
    ) {
      return;
    }
    if (restante() <= 0) {
      void finalizar(MOTIVO_FINALIZACION_SOS.TIEMPO_AGOTADO);
      return;
    }

    void enviar(estado.envio);
  }

  function marcarInterfaz() {
    if (estado.medicion.interfazMs !== null || toque === null) return;

    marcarSos(MARCA_SOS.INTERFAZ, MEDIDA_SOS.TOQUE_A_INTERFAZ);
    fijar({
      medicion: Object.freeze({
        ...estado.medicion,
        interfazMs: reloj.mono() - toque,
      }),
    });
  }

  return Object.freeze({
    contexto,
    leer: () => estado,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    enCurso: () => !descartado && FASES_EN_CURSO.includes(estado.fase),
    activar,
    reintentarActivacion,
    responder,
    reintentarEnvio,
    reintentarNodo,
    cerrar,
    reintentarFinalizacion,
    tick,
    marcarInterfaz,
    // Al cerrar sesión o salir: nada de lo que llegue después se aplica.
    descartar() {
      descartado = true;
      oyentes.clear();
    },
  });
}
