import { useEffect, useReducer, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { obtenerNodoActual } from '../../../api/sesion/obtenerNodoActual.js';
import { mapNodoActual } from '../../../services/nodoActual.js';
import {
  ESTADO_CONVERSACION,
  conversationReducer,
  crearEstadoInicial,
  selectItems,
} from '../utils/conversationState.js';

const STUDENT_HOME_PATH = '/app/estudiante';
const CHAT_ENTRY_PATH = '/app/estudiante/chat';
const LOGIN_PATH = '/login';

// §2.4: única acción que depende del `codigo`; el resto vuelve al inicio.
const CODIGO_SESION_NO_ENCONTRADA = 'SESION_NO_ENCONTRADA';

export function useChatConversationPage() {
  const { idSesion } = useParams();
  const navigate = useNavigate();
  const tituloRef = useRef(null);
  const [state, dispatch] = useReducer(
    conversationReducer,
    idSesion,
    crearEstadoInicial,
  );
  const direccionInvalida =
    state.estado === ESTADO_CONVERSACION.DIRECCION_INVALIDA;

  // RF-26: solo lectura. Al montar y en cada recarga (reintento o D7).
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

  // §2.6: al terminar la carga (contenido o error) el foco va al título;
  // así no se pierde cuando «Reintentar» se desmonta.
  useEffect(() => {
    if (
      state.estado === ESTADO_CONVERSACION.LISTO ||
      state.estado === ESTADO_CONVERSACION.ERROR
    ) {
      tituloRef.current?.focus();
    }
  }, [state.estado]);

  const sesionNoEncontrada =
    state.error?.codigo === CODIGO_SESION_NO_ENCONTRADA;

  return {
    estado: state.estado,
    items: selectItems(state),
    error: state.error,
    tituloRef,
    sesionNoEncontrada,
    retry: () => dispatch({ type: 'REINTENTAR' }),
    onRecursoError: (indice) => dispatch({ type: 'RECURSO_ERROR', indice }),
    goHome: () => navigate(STUDENT_HOME_PATH),
    goChat: () => navigate(CHAT_ENTRY_PATH),
  };
}
