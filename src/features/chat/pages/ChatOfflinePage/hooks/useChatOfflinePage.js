import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { esDemoOfflineHabilitada } from '../../../demo/demoOffline.js';
import { useConectividad } from '../../../hooks/useConectividad.js';
import { useSincronizacionChat } from '../../../hooks/useSincronizacionChat.js';
import {
  alternarSimulacionConexion,
  useSimulacionConexion,
} from '../../../hooks/useSimulacionConexion.js';
import {
  DECISION_OFFLINE,
  decidirRespuestaOffline,
} from '../../../services/offline/motorOffline.js';
import { listarPendientesSesion } from '../../../storage/index.js';
import {
  CONECTIVIDAD_INTERACCION,
  ESTADO_SINCRONIZACION_SESION,
} from '../../../types/index.js';
import {
  BloqueoOffline,
  cargarConversacionOffline,
  guardarRespuestaOffline,
  prepararNodo,
} from '../utils/conversacionOffline.js';
import {
  ESTADO_OFFLINE,
  estadoInicialOffline,
  offlineReducer,
  selectItems,
  selectNodoFormulario,
} from '../utils/offlineState.js';

const CHAT_ENTRY_PATH = '/app/estudiante/chat';

const { CARGANDO, LISTO, BLOQUEADO } = ESTADO_OFFLINE;

/*
 * Conversación sin conexión (RF-34): lee el paquete y la sesión local del
 * usuario, valida y elige el destino en el dispositivo y encola cada
 * respuesta. No hace peticiones al servidor: toda respuesta se encola,
 * con o sin conexión. La sincronización (tarea 4) solo existe con el
 * simulador de la demostración.
 */
export function useChatOfflinePage() {
  const { idSesion } = useParams();
  const { idUsuario } = useAuth();
  const navigate = useNavigate();
  const demo = esDemoOfflineHabilitada();
  const simulada = useSimulacionConexion();
  const { conectividad, disponible, marcarFalloDeRed, limpiarFalloDeRed } =
    useConectividad({ simulada: demo && simulada });
  const sincronizacion = useSincronizacionChat({
    idUsuario,
    disponible,
    marcarFalloDeRed,
    limpiarFalloDeRed,
  });
  const sesionSync = sincronizacion.estado?.sesiones[idSesion];
  const [state, dispatch] = useReducer(offlineReducer, estadoInicialOffline);
  const tituloRef = useRef(null);
  const ultimoRef = useRef(null);
  const bloqueoRef = useRef(null);
  // Candado contra dos confirmaciones antes de que el estado se pinte.
  const enVueloRef = useRef(false);
  const estadoPrevioRef = useRef(null);

  // Aviso de conexión restablecida: solo al pasar de sin conexión a en
  // línea mientras la página está abierta.
  const [conectividadPrevia, setConectividadPrevia] = useState(conectividad);
  const [restablecida, setRestablecida] = useState(false);

  if (conectividadPrevia !== conectividad) {
    setConectividadPrevia(conectividad);
    setRestablecida(conectividad === CONECTIVIDAD_INTERACCION.EN_LINEA);
  }

  const items = selectItems(state);
  const idUltimo = items.at(-1)?.id;

  useEffect(() => {
    if (!idUsuario) return undefined;

    let cancelado = false;

    cargarConversacionOffline(idSesion, idUsuario)
      .then((datos) => {
        if (!cancelado) dispatch({ type: 'CARGA_EXITO', datos });
      })
      .catch((error) => {
        if (cancelado) return;
        dispatch(
          error instanceof BloqueoOffline
            ? { type: 'CARGA_BLOQUEO', codigo: error.codigo }
            : { type: 'CARGA_ERROR' },
        );
      });

    return () => {
      cancelado = true;
    };
  }, [idSesion, idUsuario, state.recarga]);

  // Tarea 4: cuando la sincronización termina con esta sesión, el conteo
  // de pendientes se relee de la cola.
  useEffect(() => {
    if (
      !sesionSync ||
      !idUsuario ||
      sesionSync.estado === ESTADO_SINCRONIZACION_SESION.SINCRONIZANDO
    ) {
      return undefined;
    }

    let cancelado = false;

    listarPendientesSesion(idSesion, idUsuario)
      .then((lista) => {
        if (!cancelado)
          dispatch({ type: 'PENDIENTES', pendientes: lista.length });
      })
      .catch(() => {
        // Se conserva el conteo anterior.
      });

    return () => {
      cancelado = true;
    };
  }, [sesionSync, idSesion, idUsuario]);

  // Tras la carga el foco va al título; un bloqueo a mitad de la
  // conversación lleva el foco a su aviso.
  useEffect(() => {
    const previo = estadoPrevioRef.current;
    estadoPrevioRef.current = state.estado;

    if (previo === CARGANDO && state.estado !== CARGANDO) {
      tituloRef.current?.focus();
    } else if (state.estado === BLOQUEADO && previo !== null) {
      bloqueoRef.current?.focus();
    }
  }, [state.estado]);

  useEffect(() => {
    if (state.historial.length > 0) ultimoRef.current?.focus();
  }, [idUltimo, state.historial.length]);

  async function guardar({ textoRespuesta }, decision) {
    try {
      await guardarRespuestaOffline({
        idSesion,
        idUsuario,
        idNodo: state.actual.nodo.idNodo,
        decision,
        recursosNoPresentados: state.actual.recursosNoPresentados,
        conectividad,
      });
    } catch (error) {
      dispatch(
        error instanceof BloqueoOffline
          ? { type: 'BLOQUEO', codigo: error.codigo }
          : { type: 'FALLO_ESCRITURA' },
      );
      return;
    }

    // La respuesta ya quedó guardada: si preparar el destino falla, se
    // recarga desde la base en lugar de dar la escritura por fallida.
    try {
      const siguiente = await prepararNodo(
        state.paquete,
        decision.idNodoDestino,
      );
      dispatch({
        type: 'GUARDADO',
        textoRespuesta,
        siguiente,
        completada: decision.destinoTerminal,
      });
    } catch {
      dispatch({ type: 'REINTENTAR' });
    }
  }

  async function responder(respuesta) {
    if (state.estado !== LISTO || enVueloRef.current) return;

    enVueloRef.current = true;
    dispatch({ type: 'GUARDAR' });

    try {
      const decision = decidirRespuestaOffline(
        state.paquete,
        state.actual.nodo.idNodo,
        respuesta.valor,
      );

      if (decision.tipo === DECISION_OFFLINE.INVALIDA) {
        dispatch({ type: 'RESPUESTA_INVALIDA', error: decision.error });
      } else if (decision.tipo === DECISION_OFFLINE.BLOQUEO) {
        dispatch({ type: 'BLOQUEO', codigo: decision.codigo });
      } else {
        await guardar(respuesta, decision);
      }
    } finally {
      enVueloRef.current = false;
    }
  }

  return {
    estado: state.estado,
    items,
    hayHilo: items.length > 0,
    nodoFormulario: selectNodoFormulario(state),
    claveFormulario: `nodo-${state.paso}`,
    errorRespuesta: state.errorRespuesta,
    bloqueo: state.bloqueo,
    pendientes: state.pendientes,
    retomada: state.retomada,
    recursosNoPresentados: state.actual?.recursosNoPresentados.length ?? 0,
    otrosNoPresentables: state.actual?.otrosNoPresentables ?? 0,
    conectividad,
    restablecida,
    demo,
    simulada,
    alternarSimulacion: alternarSimulacionConexion,
    sincronizacion: sincronizacion.activa
      ? { sesion: sesionSync, simulada: sincronizacion.simulada }
      : null,
    tituloRef,
    ultimoRef,
    bloqueoRef,
    responder,
    retry: () => dispatch({ type: 'REINTENTAR' }),
    goChat: () => navigate(CHAT_ENTRY_PATH),
  };
}
