import { useEffect, useReducer, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { enviarRespuesta } from '../../../api/sesion/enviarRespuesta.js';
import { obtenerHistorialInteracciones } from '../../../api/sesion/obtenerHistorialInteracciones.js';
import { obtenerNodoActual } from '../../../api/sesion/obtenerNodoActual.js';
import { REGISTRO_ENTRADAS } from '../../../components/NodeInput/registroEntradas.js';
import { mapHistorial } from '../../../services/historialInteracciones.js';
import { mapNodoActual } from '../../../services/nodoActual.js';
import { mapResultadoRespuesta } from '../../../services/resultadoRespuesta.js';
import {
  ESTADO_CONVERSACION,
  ESTADO_HISTORIAL,
  conversationReducer,
  crearEstadoInicial,
  selectItems,
  selectNodoFormulario,
  selectRecursosNoPresentados,
  selectSecuenciaSiguiente,
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

// RF-32: el texto de la burbuja del historial se arma igual que al
// responder (registro de entradas), con la etiqueta y no el valor interno.
const textoDe = (entrada, tipo, valor) =>
  REGISTRO_ENTRADAS[tipo]?.textoRespuesta(entrada, valor) ?? null;

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
  // Solo el avance en vivo mueve el foco; cargar el historial no lo roba.
  const huboAvance = state.paso > 0;

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

  // RF-32: historial reciente. Al montar y en cada resincronización o
  // reintento. Si falla, el nodo actual sigue disponible (CA-32-5).
  useEffect(() => {
    if (direccionInvalida) return undefined;

    let cancelado = false;

    obtenerHistorialInteracciones(idSesion)
      .then((data) => {
        if (!cancelado) {
          dispatch({
            type: 'HISTORIAL_EXITO',
            pagina: mapHistorial(data, textoDe),
          });
        }
      })
      .catch((error) => {
        if (cancelado) return;

        if (error?.status === 401) {
          navigate(LOGIN_PATH, { replace: true });
          return;
        }

        dispatch({ type: 'HISTORIAL_ERROR', error });
      });

    return () => {
      cancelado = true;
    };
  }, [idSesion, state.recargaHistorial, direccionInvalida, navigate]);

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
    if (huboAvance) ultimoRef.current?.focus();
  }, [idUltimo, huboAvance, state.paso]);

  // `enviar` atrapa sus propios errores: quien la llama no espera nada.
  async function enviar(envio, accion) {
    if (enVueloRef.current) return;

    enVueloRef.current = true;
    dispatch(accion);

    try {
      const data = await enviarRespuesta(idSesion, envio.cuerpo);
      dispatch({ type: 'ENVIO_EXITO', respuesta: mapResultadoRespuesta(data) });
    } catch (error) {
      if (clasificarErrorEnvio(error) !== ACCION_ERROR_ENVIO.LOGIN) {
        dispatch({ type: 'ENVIO_ERROR', error });
      } else if (vivoRef.current) {
        navigate(LOGIN_PATH, { replace: true });
      }
    }
  }

  // D7: cada confirmación es una respuesta nueva (id_interaccion nuevo),
  // con la secuencia siguiente y los recursos no mostrados (RF-30, RF-33).
  function responder({ valor, textoRespuesta }) {
    if (state.estado !== LISTO) return;

    const envio = {
      cuerpo: crearCuerpo(state.conversacion.nodo, valor, {
        secuencia: selectSecuenciaSiguiente(state),
        recursosNoPresentados: selectRecursosNoPresentados(state),
      }),
      textoRespuesta,
    };
    void enviar(envio, { type: 'ENVIAR', envio });
  }

  // CA-32-2: la página anterior a la más antigua cargada.
  async function cargarAnteriores() {
    if (!state.hayMas || state.cargandoAnteriores) return;

    dispatch({ type: 'CARGAR_ANTERIORES' });

    try {
      const data = await obtenerHistorialInteracciones(idSesion, {
        antesDe: state.secuenciaMinima,
      });
      if (vivoRef.current) {
        dispatch({
          type: 'ANTERIORES_EXITO',
          pagina: mapHistorial(data, textoDe),
        });
      }
    } catch (error) {
      if (!vivoRef.current) return;
      if (error?.status === 401) {
        navigate(LOGIN_PATH, { replace: true });
        return;
      }
      dispatch({ type: 'ANTERIORES_ERROR', error });
    }
  }

  // D7: el reintento reenvía el mismo cuerpo (mismo id_interaccion y
  // misma secuencia).
  function reintentarEnvio() {
    if (state.estado !== ERROR_ENVIO || !state.envio) return;

    void enviar(state.envio, { type: 'REINTENTAR_ENVIO' });
  }

  const accionErrorEnvio = state.errorEnvio
    ? clasificarErrorEnvio(state.errorEnvio)
    : null;

  // Esqueleto inicial hasta tener nodo e historial (o su error).
  const cargandoInicial =
    state.estado === CARGANDO ||
    (state.historialEstado === ESTADO_HISTORIAL.CARGANDO &&
      !huboAvance &&
      state.historial.length === 0);

  return {
    estado: state.estado,
    cargandoInicial,
    historialError:
      state.historialEstado === ESTADO_HISTORIAL.ERROR
        ? state.historialError
        : null,
    hayMas: state.hayMas,
    cargandoAnteriores: state.cargandoAnteriores,
    errorAnteriores: state.errorAnteriores,
    cargarAnteriores: () => void cargarAnteriores(),
    reintentarHistorial: () => dispatch({ type: 'REINTENTAR_HISTORIAL' }),
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
