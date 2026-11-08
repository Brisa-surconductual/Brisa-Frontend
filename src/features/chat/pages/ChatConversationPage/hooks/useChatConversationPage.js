import { useEffect, useReducer, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { enviarRespuesta } from '../../../api/sesion/enviarRespuesta.js';
import { obtenerNodoActual } from '../../../api/sesion/obtenerNodoActual.js';
import { mapNodoActual } from '../../../services/nodoActual.js';
import {
  ESTADO_CONVERSACION,
  conversationReducer,
  crearEstadoInicial,
  selectItems,
  selectNodoFormulario,
} from '../utils/conversationState.js';
import {
  ACCION_ERROR_ENVIO,
  clasificarErrorEnvio,
  crearCuerpo,
} from '../utils/envio.js';

const STUDENT_HOME_PATH = '/app/estudiante';
const CHAT_ENTRY_PATH = '/app/estudiante/chat';
const LOGIN_PATH = '/login';

// §2.4 de FE-M03-03: única acción del GET que depende del `codigo`.
const CODIGO_SESION_NO_ENCONTRADA = 'SESION_NO_ENCONTRADA';

const { CARGANDO, LISTO, ERROR, AVANZANDO, ERROR_ENVIO, DIRECCION_INVALIDA } =
  ESTADO_CONVERSACION;

export function useChatConversationPage() {
  const { idSesion } = useParams();
  const navigate = useNavigate();
  const tituloRef = useRef(null);
  const errorRef = useRef(null);
  const ultimoRef = useRef(null);
  // D12: candado contra dos confirmaciones en el mismo ciclo (doble toque
  // en una opción de envío inmediato), antes de que el estado se pinte.
  const enVueloRef = useRef(false);
  const vivoRef = useRef(false);
  const estadoPrevioRef = useRef(null);
  const [state, dispatch] = useReducer(
    conversationReducer,
    idSesion,
    crearEstadoInicial,
  );
  const direccionInvalida = state.estado === DIRECCION_INVALIDA;
  const items = selectItems(state);
  const idUltimo = items.at(-1)?.id;
  const hayHistorial = state.historial.length > 0;

  useEffect(() => {
    vivoRef.current = true;
    return () => {
      vivoRef.current = false;
    };
  }, []);

  // RF-26: solo lectura. Al montar y en cada recarga (reintento, recurso
  // caído, avance tras un 200 o NODO_DESACTUALIZADO).
  useEffect(() => {
    if (direccionInvalida) {
      navigate(CHAT_ENTRY_PATH, { replace: true });
      return undefined;
    }

    let cancelado = false;

    obtenerNodoActual(idSesion)
      .then((data) => {
        if (!cancelado) {
          dispatch({ type: 'EXITO', conversacion: mapNodoActual(data) });
        }
      })
      .catch((error) => {
        if (cancelado) return;

        // El 401 llega con `codigo: null`: se decide por estado HTTP.
        if (error?.status === 401) {
          navigate(LOGIN_PATH, { replace: true });
          return;
        }

        dispatch({ type: 'ERROR', error });
      });

    return () => {
      cancelado = true;
    };
  }, [idSesion, state.recarga, direccionInvalida, navigate]);

  // El candado se abre cuando la página vuelve a admitir una acción.
  // `errorEnvio` cuenta: un 400 vuelve a LISTO sin cambiar `estado`.
  useEffect(() => {
    if (state.estado === LISTO || state.estado === ERROR_ENVIO) {
      enVueloRef.current = false;
    }
  }, [state.estado, state.errorEnvio]);

  // Al terminar la carga inicial (contenido o error) el foco va al título;
  // así no se pierde cuando «Reintentar» se desmonta. Un error a mitad de
  // conversación lleva el foco a su bloque, sin saltar al principio.
  useEffect(() => {
    const previo = estadoPrevioRef.current;
    estadoPrevioRef.current = state.estado;

    if (previo === CARGANDO && state.estado !== CARGANDO) {
      tituloRef.current?.focus();
    } else if (
      state.estado === ERROR_ENVIO ||
      (state.estado === ERROR && previo === AVANZANDO)
    ) {
      errorRef.current?.focus();
    }
  }, [state.estado]);

  // §2.4: lo nuevo del hilo recibe el foco (la burbuja y luego el nodo, o
  // la última burbuja si la sesión se completó). `paso` cubre CONTINUAR
  // que completa la sesión: no agrega burbuja y el último item no cambia.
  // No corre tras un 400 ni con la recarga de recursos.
  useEffect(() => {
    if (hayHistorial) ultimoRef.current?.focus();
  }, [idUltimo, hayHistorial, state.paso]);

  async function enviar(envio, accion) {
    if (enVueloRef.current) return;

    enVueloRef.current = true;
    dispatch(accion);

    try {
      const respuesta = await enviarRespuesta(idSesion, envio.cuerpo);
      dispatch({ type: 'ENVIO_EXITO', respuesta });
    } catch (error) {
      if (clasificarErrorEnvio(error) !== ACCION_ERROR_ENVIO.LOGIN) {
        dispatch({ type: 'ENVIO_ERROR', error });
      } else if (vivoRef.current) {
        navigate(LOGIN_PATH, { replace: true });
      }
    }
  }

  // D7: cada confirmación es una respuesta nueva (idRespuesta nuevo).
  function responder({ valor, textoRespuesta }) {
    if (state.estado !== LISTO) return;

    const envio = {
      cuerpo: crearCuerpo(state.conversacion.nodo, valor),
      textoRespuesta,
    };
    enviar(envio, { type: 'ENVIAR', envio });
  }

  // D7: el reintento reenvía el mismo cuerpo, con el mismo idRespuesta.
  function reintentarEnvio() {
    if (state.estado !== ERROR_ENVIO || !state.envio) return;

    enviar(state.envio, { type: 'REINTENTAR_ENVIO' });
  }

  const accionErrorEnvio = state.errorEnvio
    ? clasificarErrorEnvio(state.errorEnvio)
    : null;

  return {
    estado: state.estado,
    items,
    error: state.error,
    errorEnvio: state.errorEnvio,
    accionErrorEnvio,
    aviso: state.aviso,
    nodoFormulario: selectNodoFormulario(state),
    claveFormulario: `nodo-${state.paso}`,
    hayHilo: items.length > 0,
    tituloRef,
    errorRef,
    ultimoRef,
    sesionNoEncontrada: state.error?.codigo === CODIGO_SESION_NO_ENCONTRADA,
    retry: () => dispatch({ type: 'REINTENTAR' }),
    onRecursoError: (indice) => dispatch({ type: 'RECURSO_ERROR', indice }),
    responder,
    reintentarEnvio,
    goHome: () => navigate(STUDENT_HOME_PATH),
    goChat: () => navigate(CHAT_ENTRY_PATH),
  };
}
