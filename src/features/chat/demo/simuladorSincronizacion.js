import { CHAT_CLIENT_ERROR, createChatApiError } from '../api/chatApiUtils.js';
import {
  DECISION_OFFLINE,
  decidirRespuestaOffline,
} from '../services/offline/motorOffline.js';
import { esLoteValido } from '../services/sincronizacion/loteSincronizacion.js';
import { obtenerPaquete } from '../storage/index.js';
import {
  CODIGO_SINCRONIZACION,
  RESULTADO_SINCRONIZACION,
} from '../types/index.js';

import {
  ID_NODO_INICIAL_DEMO,
  PAQUETE_DEMO_OFFLINE,
} from './paqueteDemoOffline.js';

/*
 * SOLO DESARROLLO. Simulador del contrato
 * POST /chat/sesiones/{id_sesion}/interacciones/sincronizar. No hace
 * peticiones: un «servidor» en memoria de este navegador responde con el
 * formato previsto y aplica las reglas D4 sobre el paquete de
 * demostración. Nada de lo que confirma existe en el backend real.
 *
 * Su estado vive en memoria y se copia en localStorage para que, al
 * recargar, siga reconociendo lo ya «sincronizado» (y responda DUPLICADA).
 */

const { SINCRONIZADA, DUPLICADA, RECHAZADA, PENDIENTE } =
  RESULTADO_SINCRONIZACION;

// Respuesta del próximo envío. Se consume en un envío y vuelve a ÉXITO.
export const ESCENARIO_SIMULADOR = Object.freeze({
  EXITO: 'EXITO',
  DUPLICADA: 'DUPLICADA',
  RECHAZO: 'RECHAZO',
  PENDIENTE: 'PENDIENTE',
  INTERRUPCION: 'INTERRUPCION',
  ERROR_SERVIDOR: 'ERROR_SERVIDOR',
  NO_AUTENTICADO: 'NO_AUTENTICADO',
  CSRF_INVALIDO: 'CSRF_INVALIDO',
  SESION_NO_ENCONTRADA: 'SESION_NO_ENCONTRADA',
  LOTE_INVALIDO: 'LOTE_INVALIDO',
});

export const ETIQUETA_ESCENARIO = Object.freeze({
  EXITO: 'Éxito: procesa todo el lote',
  DUPLICADA: 'La primera interacción ya estaba registrada (DUPLICADA)',
  RECHAZO: 'Rechaza una interacción (RECHAZADA)',
  PENDIENTE: 'Procesa solo la primera; el resto queda PENDIENTE',
  INTERRUPCION: 'Procesa el lote, pero la respuesta no llega',
  ERROR_SERVIDOR: '500 ERROR_SINCRONIZACION',
  NO_AUTENTICADO: '401 NO_AUTENTICADO',
  CSRF_INVALIDO: '403 CSRF_INVALIDO (se renueva y se reintenta)',
  SESION_NO_ENCONTRADA: '404 SESION_NO_ENCONTRADA',
  LOTE_INVALIDO: '400 LOTE_INVALIDO',
});

// Texto del ejemplo del contrato para el rechazo simulado.
const RECHAZO_SIMULADO = Object.freeze({
  codigo: 'FUERA_DE_RANGO',
  mensaje: 'El valor ingresado está fuera del rango permitido.',
});

const CLAVE_ALMACEN = 'brisa-demo-servidor-sincronizacion';

function leerServidor() {
  try {
    const crudo = globalThis.localStorage?.getItem(CLAVE_ALMACEN);
    const datos = crudo ? JSON.parse(crudo) : null;
    return datos && typeof datos === 'object' ? datos : {};
  } catch {
    return {};
  }
}

function guardarServidor(sesiones) {
  try {
    globalThis.localStorage?.setItem(CLAVE_ALMACEN, JSON.stringify(sesiones));
  } catch {
    // Sin almacenamiento el simulador sigue en memoria.
  }
}

function errorSimulado(code, status, message = '') {
  return createChatApiError({ code, status, message });
}

const sinRespuesta = () => errorSimulado(CHAT_CLIENT_ERROR.SIN_CONEXION, null);

// Espera cancelable: si se corta, es una petición sin respuesta.
function esperar(ms, senal) {
  return new Promise((resolve, reject) => {
    if (senal?.aborted) {
      reject(sinRespuesta());
      return;
    }
    const id = setTimeout(() => {
      senal?.removeEventListener('abort', cortar);
      resolve();
    }, ms);
    function cortar() {
      clearTimeout(id);
      reject(sinRespuesta());
    }
    senal?.addEventListener('abort', cortar, { once: true });
  });
}

// Recorre el lote en orden (D4). Muta `servidor`.
function procesarLote(servidor, interacciones, escenario) {
  const registradas = new Set(servidor.ids);
  const resultados = [];
  let detenido = false;

  const avanzar = (item) => {
    const decision = decidirRespuestaOffline(
      PAQUETE_DEMO_OFFLINE,
      item.id_nodo,
      item.valor,
    );

    if (decision.tipo === DECISION_OFFLINE.AVANZAR) {
      registradas.add(item.id_interaccion);
      servidor.ultima_secuencia = item.secuencia;
      servidor.id_nodo_actual = decision.idNodoDestino;
      if (decision.destinoTerminal) servidor.estado_sesion = 'COMPLETADA';
      return null;
    }
    return decision.tipo === DECISION_OFFLINE.INVALIDA
      ? decision.error
      : { codigo: decision.codigo, mensaje: null };
  };

  // Como si un envío anterior hubiera llegado sin que el cliente lo sepa.
  if (escenario === ESCENARIO_SIMULADOR.DUPLICADA) {
    const [primera] = interacciones;
    if (primera.secuencia === servidor.ultima_secuencia + 1) avanzar(primera);
  }

  const indiceRechazo = Math.min(1, interacciones.length - 1);

  interacciones.forEach((item, n) => {
    const fila = (resultado, error = null) =>
      resultados.push({
        id_interaccion: item.id_interaccion,
        secuencia: item.secuencia,
        resultado,
        codigo: error?.codigo ?? null,
        mensaje: error?.mensaje ?? null,
      });

    if (detenido) return fila(PENDIENTE);
    if (registradas.has(item.id_interaccion)) return fila(DUPLICADA);

    if (escenario === ESCENARIO_SIMULADOR.PENDIENTE && n >= 1) {
      detenido = true;
      return fila(PENDIENTE);
    }
    if (escenario === ESCENARIO_SIMULADOR.RECHAZO && n === indiceRechazo) {
      detenido = true;
      return fila(RECHAZADA, RECHAZO_SIMULADO);
    }
    if (item.secuencia !== servidor.ultima_secuencia + 1) {
      detenido = true;
      return fila(RECHAZADA, {
        codigo: 'SECUENCIA_FUERA_DE_ORDEN',
        mensaje: null,
      });
    }

    const error = avanzar(item);
    if (error) {
      detenido = true;
      return fila(RECHAZADA, error);
    }
    return fila(SINCRONIZADA);
  });

  servidor.ids = [...registradas];

  const contar = (r) => resultados.filter((f) => f.resultado === r).length;

  return {
    resultados,
    resumen: {
      total: resultados.length,
      sincronizadas: contar(SINCRONIZADA),
      duplicadas: contar(DUPLICADA),
      rechazadas: contar(RECHAZADA),
      pendientes: contar(PENDIENTE),
    },
    id_nodo_actual: servidor.id_nodo_actual,
    estado_sesion: servidor.estado_sesion,
  };
}

function crearSimulador() {
  const oyentes = new Set();
  let escenario = ESCENARIO_SIMULADOR.EXITO;
  let latenciaMs = 1_200;
  let conexionDisponible = () => true;
  let idEvento = 0;
  const estadisticas = { solicitudes: 0, enCurso: 0, simultaneasMaximas: 0 };
  let sesiones = leerServidor();

  const avisar = () => oyentes.forEach((fn) => fn());

  function consumirEscenario() {
    const actual = escenario;
    escenario = ESCENARIO_SIMULADOR.EXITO;
    avisar();
    return actual;
  }

  // La sesión del «servidor». Una sesión de demostración del usuario que
  // el servidor aún no conoce se adopta desde el inicio: las crea
  // `prepararSesionDemoOffline` con secuencia 0 y nunca tuvieron
  // respuestas en línea. De otro usuario o ajena a la demo: no existe.
  async function sesionServidor(idSesion, idUsuario) {
    const existente = sesiones[idSesion];
    if (existente) return existente.id_usuario === idUsuario ? existente : null;

    const paquete = await obtenerPaquete(idSesion, idUsuario);
    if (
      paquete?.id_flujo_conversacional !==
      PAQUETE_DEMO_OFFLINE.id_flujo_conversacional
    ) {
      return null;
    }

    sesiones[idSesion] = {
      id_usuario: idUsuario,
      ultima_secuencia: 0,
      id_nodo_actual: ID_NODO_INICIAL_DEMO,
      estado_sesion: 'ACTIVA',
      ids: [],
    };
    return sesiones[idSesion];
  }

  async function atender(idUsuario, idSesion, cuerpo, senal) {
    const elegido = consumirEscenario();
    const { interacciones } = cuerpo ?? {};

    // Ida de la petición.
    await esperar(latenciaMs / 2, senal);

    switch (elegido) {
      case ESCENARIO_SIMULADOR.NO_AUTENTICADO:
        throw errorSimulado(CODIGO_SINCRONIZACION.NO_AUTENTICADO, 401);
      case ESCENARIO_SIMULADOR.CSRF_INVALIDO:
        throw errorSimulado(CODIGO_SINCRONIZACION.CSRF_INVALIDO, 403);
      case ESCENARIO_SIMULADOR.ERROR_SERVIDOR:
        throw errorSimulado(CODIGO_SINCRONIZACION.ERROR_SINCRONIZACION, 500);
      default:
    }

    if (
      elegido === ESCENARIO_SIMULADOR.LOTE_INVALIDO ||
      !esLoteValido(interacciones)
    ) {
      throw errorSimulado(CODIGO_SINCRONIZACION.LOTE_INVALIDO, 400);
    }

    const servidor =
      elegido === ESCENARIO_SIMULADOR.SESION_NO_ENCONTRADA
        ? null
        : await sesionServidor(idSesion, idUsuario);

    if (!servidor) {
      throw errorSimulado(CODIGO_SINCRONIZACION.SESION_NO_ENCONTRADA, 404);
    }

    const data = procesarLote(servidor, interacciones, elegido);
    idEvento += 1;
    guardarServidor(sesiones);

    // Vuelta de la respuesta: si aquí se pierde la red, el lote ya quedó
    // procesado y el reintento recibirá DUPLICADA.
    await esperar(latenciaMs / 2, senal);
    if (elegido === ESCENARIO_SIMULADOR.INTERRUPCION || !conexionDisponible()) {
      throw sinRespuesta();
    }

    return { data: { id_evento: idEvento, ...data } };
  }

  return Object.freeze({
    // Transporte del usuario autenticado (el servidor real lo sabría por
    // la cookie de sesión; el cuerpo nunca lleva `id_usuario`).
    crearTransporte(idUsuario) {
      return Object.freeze({
        async sincronizar(idSesion, cuerpo, { senal } = {}) {
          estadisticas.solicitudes += 1;
          estadisticas.enCurso += 1;
          estadisticas.simultaneasMaximas = Math.max(
            estadisticas.simultaneasMaximas,
            estadisticas.enCurso,
          );
          avisar();
          try {
            return await atender(idUsuario, idSesion, cuerpo, senal);
          } finally {
            estadisticas.enCurso -= 1;
            avisar();
          }
        },
        // Simula la renovación del token: no llama a ningún servicio.
        async renovarCsrf({ senal } = {}) {
          await esperar(latenciaMs / 4, senal);
        },
      });
    },
    configurar(opciones = {}) {
      if (typeof opciones.conexionDisponible === 'function') {
        conexionDisponible = opciones.conexionDisponible;
      }
      if (Number.isFinite(opciones.latenciaMs) && opciones.latenciaMs >= 0) {
        latenciaMs = opciones.latenciaMs;
      }
    },
    elegirEscenario(nuevo) {
      if (Object.hasOwn(ESCENARIO_SIMULADOR, nuevo)) {
        escenario = nuevo;
        avisar();
      }
    },
    escenario: () => escenario,
    estadisticas: () => ({ ...estadisticas }),
    suscribir(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
    // Solo pruebas: olvida todo lo «sincronizado».
    reiniciar() {
      sesiones = {};
      guardarServidor(sesiones);
      escenario = ESCENARIO_SIMULADOR.EXITO;
      Object.assign(estadisticas, {
        solicitudes: 0,
        enCurso: 0,
        simultaneasMaximas: 0,
      });
      avisar();
    },
  });
}

let simulador = null;

// Un único «servidor» por pestaña, compartido por las pantallas.
export function obtenerSimulador() {
  simulador ??= crearSimulador();
  return simulador;
}
