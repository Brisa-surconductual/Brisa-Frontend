import { useEffect, useReducer, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { API_ERROR_CLIENTE } from '@/shared/utils/apiError.js';

import { enviarRespuesta } from '../../../api/sesion/enviarRespuesta.js';
import { iniciarSesionConversacional } from '../../../api/sesion/iniciarSesionConversacional.js';
import { obtenerHistorialInteracciones } from '../../../api/sesion/obtenerHistorialInteracciones.js';
import { obtenerNodoActual } from '../../../api/sesion/obtenerNodoActual.js';
import { REGISTRO_ENTRADAS } from '../../../components/NodeInput/registroEntradas.js';
import {
  CODIGO_ERROR_CLIENTE,
  registrarErrorCliente,
} from '../../../services/erroresCliente.js';
import { mapHistorial } from '../../../services/historialInteracciones.js';
import {
  leerInicioSesion,
  olvidarInicioSesion,
  recordarInicioSesion,
} from '../../../services/inicioSesionReciente.js';
import { mapNodoActual } from '../../../services/nodoActual.js';
import { mapResultadoRespuesta } from '../../../services/resultadoRespuesta.js';
import {
  MENSAJE_RECUPERADA_DESDE_HISTORIAL,
  errorInicioParaConversacion,
  mapInicioSesion,
} from '../../../services/sesionConversacional.js';
import {
  ESTADO_CONVERSACION,
  ESTADO_HISTORIAL,
  conversationReducer,
  crearEstadoInicial,
  prepararInicio,
  selectHayRecursoNoDisponible,
  selectItems,
  selectMostrarDificultad,
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
const CHAT_SESION_PATH = '/app/estudiante/chat/sesion';
const LOGIN_PATH = '/login';

// RF-37: sin respuesta del servidor (el backend no pudo registrarlo).
const esSinConexion = (error) =>
  error != null &&
  error.status == null &&
  error.codigo === API_ERROR_CLIENTE.SIN_CONEXION;

// §2.4 de FE-M03-03: única acción del GET que depende del `codigo`.
const CODIGO_SESION_NO_ENCONTRADA = 'SESION_NO_ENCONTRADA';

const {
  CARGANDO,
  LISTO,
  ERROR,
  AVANZANDO,
  ERROR_ENVIO,
  DIRECCION_INVALIDA,
  COMPLETADA,
  RECUPERANDO,
} = ESTADO_CONVERSACION;

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
  const completadaRef = useRef(null);
  const completadaPreviaRef = useRef(null);
  // D12: candado contra dos confirmaciones en el mismo ciclo (doble toque
  // en una opción de envío inmediato), antes de que el estado se pinte.
  const enVueloRef = useRef(false);
  const vivoRef = useRef(false);
  const estadoPrevioRef = useRef(null);
  const [state, dispatch] = useReducer(conversationReducer, idSesion, (id) =>
    // RF-32: la respuesta de /iniciar de este mismo `idSesion`, si la
    // pantalla de entrada la dejó en memoria.
    crearEstadoInicial(id, prepararInicio(leerInicioSesion(id), textoDe)),
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

  // RF-32: los datos de /iniciar se usan una sola vez; una visita
  // posterior a la misma URL vuelve a consultar por GET.
  useEffect(() => {
    olvidarInicioSesion(idSesion);
  }, [idSesion]);

  // RF-37: recuperación con /iniciar (RF-32) tras NODO_DESACTUALIZADO o
  // ESTADO_INCONSISTENTE. Una petición por incremento de `recuperacion`;
  // el reducer no pide otra si esta falla.
  useEffect(() => {
    if (state.recuperacion === 0) return undefined;

    let cancelado = false;

    iniciarSesionConversacional()
      .then((data) => {
        if (cancelado) return;

        const modelo = mapInicioSesion(data);

        // El backend entregó otra sesión: se abre esa, con estos mismos
        // datos (solo en memoria) y sin pedirlos de nuevo.
        if (modelo.sesion.idSesion !== idSesion) {
          recordarInicioSesion(modelo);
          navigate(`${CHAT_SESION_PATH}/${modelo.sesion.idSesion}`, {
            replace: true,
          });
          return;
        }

        dispatch({
          type: 'RECUPERACION_EXITO',
          inicio: prepararInicio(modelo, textoDe),
        });
      })
      .catch((error) => {
        if (cancelado) return;

        if (error?.status === 401) {
          navigate(LOGIN_PATH, { replace: true });
          return;
        }

        dispatch({
          type: 'RECUPERACION_ERROR',
          error: errorInicioParaConversacion(error),
        });
      });

    return () => {
      cancelado = true;
    };
  }, [idSesion, state.recuperacion, navigate]);

  // RF-37: el backend no ve la falta de conexión ni un recurso que el
  // navegador no pudo mostrar; se reportan (sin esperar ni bloquear). Los
  // errores HTTP no se reportan: el backend ya los registró.
  const sinConexion = [
    state.error,
    state.errorEnvio,
    state.historialError,
    state.errorAnteriores,
  ].some(esSinConexion);
  const recursoNoDisponible = selectHayRecursoNoDisponible(state);

  useEffect(() => {
    if (!sinConexion) return;
    void registrarErrorCliente({
      codigo: CODIGO_ERROR_CLIENTE.SIN_CONEXION,
      idSesion,
    });
  }, [sinConexion, idSesion]);

  useEffect(() => {
    if (!recursoNoDisponible) return;
    void registrarErrorCliente({
      codigo: CODIGO_ERROR_CLIENTE.RECURSO_NO_DISPONIBLE,
      idSesion,
    });
  }, [recursoNoDisponible, idSesion, state.paso]);

  // RF-26: solo lectura. Al montar y en cada recarga (reintento, recurso
  // caído, avance tras un 200 o NODO_DESACTUALIZADO).
  useEffect(() => {
    if (direccionInvalida) {
      navigate(CHAT_ENTRY_PATH, { replace: true });
      return undefined;
    }

    // RF-32: el nodo llegó con /iniciar; solo las recargas lo piden.
    if (state.nodoPrecargado && state.recarga === 0) return undefined;

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
  }, [
    idSesion,
    state.recarga,
    state.nodoPrecargado,
    direccionInvalida,
    navigate,
  ]);

  // RF-32: historial reciente. Al montar y en cada resincronización o
  // reintento. Si falla, el nodo actual sigue disponible (CA-32-5).
  useEffect(() => {
    if (direccionInvalida) return undefined;

    // RF-32: la página reciente llegó con /iniciar; solo las
    // resincronizaciones y reintentos la piden.
    if (state.historialPrecargado && state.recargaHistorial === 0) {
      return undefined;
    }

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
  }, [
    idSesion,
    state.recargaHistorial,
    state.historialPrecargado,
    direccionInvalida,
    navigate,
  ]);

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

    // Con los datos de /iniciar la página monta ya cargada (previo null).
    if ((previo === CARGANDO || previo === null) && state.estado !== CARGANDO) {
      tituloRef.current?.focus();
    } else if (
      state.estado === ERROR_ENVIO ||
      (state.estado === ERROR &&
        (previo === AVANZANDO || previo === RECUPERANDO))
    ) {
      errorRef.current?.focus();
    }
  }, [state.estado]);

  // §2.4: lo nuevo del hilo recibe el foco (la burbuja y luego el nodo).
  // `paso` cubre CONTINUAR que completa la sesión: no agrega burbuja y el
  // último item no cambia. No corre tras un 400 ni con la recarga de
  // recursos. Con la sesión completada el foco es del aviso de cierre
  // (CA-31-4): el nodo final, que llega después, no se lo quita.
  const sesionCompletada = state.estado === COMPLETADA;

  useEffect(() => {
    if (huboAvance && !sesionCompletada) ultimoRef.current?.focus();
  }, [idUltimo, huboAvance, state.paso, sesionCompletada]);

  // RF-31: al completarse la sesión durante la visita, el foco va al aviso
  // de sesión completada (después del efecto anterior, que lo movería a la
  // última burbuja). Al abrir una sesión ya completada manda el título.
  useEffect(() => {
    const previo = completadaPreviaRef.current;
    completadaPreviaRef.current = state.estado;

    if (
      state.estado === COMPLETADA &&
      previo !== null &&
      previo !== CARGANDO &&
      previo !== COMPLETADA
    ) {
      completadaRef.current?.focus();
    }
  }, [state.estado]);

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
        antesDeSecuencia: state.secuenciaMinima,
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
    // RF-31: el historial cargó y no quedan interacciones anteriores.
    inicioAlcanzado:
      state.historialEstado === ESTADO_HISTORIAL.LISTO && !state.hayMas,
    completada: state.estado === COMPLETADA,
    completadaRef,
    cargandoAnteriores: state.cargandoAnteriores,
    errorAnteriores: state.errorAnteriores,
    cargarAnteriores: () => void cargarAnteriores(),
    reintentarHistorial: () => dispatch({ type: 'REINTENTAR_HISTORIAL' }),
    items,
    error: state.error,
    errorEnvio: state.errorEnvio,
    accionErrorEnvio,
    aviso: state.aviso,
    // RF-32: aviso discreto hasta el primer avance.
    avisoRecuperacion:
      state.recuperadaDesdeHistorial && state.paso === state.pasoRecuperada
        ? MENSAJE_RECUPERADA_DESDE_HISTORIAL
        : null,
    // RF-37: tres rechazos de validación en el nodo.
    mostrarDificultad: selectMostrarDificultad(state),
    ayudaSolicitada: state.ayudaSolicitada,
    pedirAyuda: () => dispatch({ type: 'PEDIR_AYUDA' }),
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
