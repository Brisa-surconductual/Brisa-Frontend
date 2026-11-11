import { useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';

import { iniciarSesionConversacional } from '../../../api/sesion/iniciarSesionConversacional.js';
import {
  describirErrorInicio,
  mapInicioSesion,
} from '../../../services/sesionConversacional.js';
import {
  chatEntryReducer,
  initialChatEntryState,
} from '../utils/chatEntryState.js';

const STUDENT_HOME_PATH = '/app/estudiante';
const LOGIN_PATH = '/login';

async function cargarSesion(dispatch, estaCancelado = () => false) {
  try {
    const data = await iniciarSesionConversacional();

    if (!estaCancelado()) {
      dispatch({ type: 'EXITO', sesion: mapInicioSesion(data) });
    }
  } catch (error) {
    if (!estaCancelado()) {
      dispatch({ type: 'ERROR', error: describirErrorInicio(error) });
    }
  }
}

export function useChatEntryPage() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(chatEntryReducer, initialChatEntryState);

  // Una sola llamada al entrar: crea la sesión o reanuda la activa.
  useEffect(() => {
    let cancelado = false;

    cargarSesion(dispatch, () => cancelado);

    return () => {
      cancelado = true;
    };
  }, []);

  function retry() {
    dispatch({ type: 'CARGANDO' });
    cargarSesion(dispatch);
  }

  return {
    estado: state.estado,
    sesion: state.sesion,
    error: state.error,
    retry,
    goHome: () => navigate(STUDENT_HOME_PATH),
    goLogin: () => navigate(LOGIN_PATH, { replace: true }),
    // D2: RF-24 entrega el idSesion con el que RF-26 pide el nodo actual.
    goConversation: () =>
      navigate(`/app/estudiante/chat/sesion/${state.sesion.sesion.idSesion}`),
  };
}
