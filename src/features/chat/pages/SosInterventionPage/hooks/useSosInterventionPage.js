import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';

import { recordarInicioSesion } from '../../../services/inicioSesionReciente.js';
import { errorInicioParaConversacion } from '../../../services/sesionConversacional.js';
import {
  descartarIntervencionSos,
  intervencionSosActual,
  solicitarIntervencionSos,
} from '../../../services/sos/intervencionSosActual.js';
import { marcarToqueSos } from '../../../services/sos/medicionSos.js';
import {
  STUDENT_HOME_PATH,
  TIPO_RETORNO_SOS,
  decidirRetornoSos,
  reanudarSesionPausada,
} from '../../../services/sos/retornoSos.js';
import { RELOJ_NAVEGADOR } from '../../../services/sos/tiempoSos.js';
import { ACCION_ERROR_ENVIO_SOS, FASE_SOS } from '../../../types/sos.js';

const LOGIN_PATH = '/login';

// Cada cuánto se recalcula la cuenta (el valor sale siempre del límite).
const INTERVALO_TICK_MS = 250;

export const ESTADO_RETORNO = Object.freeze({
  INACTIVO: 'INACTIVO',
  REANUDANDO: 'REANUDANDO',
  // /iniciar no devolvió la misma sesión o el mismo nodo.
  NO_EXACTO: 'NO_EXACTO',
  ERROR: 'ERROR',
});

const RETORNO_INACTIVO = Object.freeze({ estado: ESTADO_RETORNO.INACTIVO });

const ESTADO_SIN_INTERVENCION = Object.freeze({
  fase: FASE_SOS.SIN_INTERVENCION,
  intervencion: null,
  restanteMs: null,
  nodo: null,
  secuencia: 0,
  enviando: false,
  errorEnvio: null,
  accionErrorEnvio: null,
  cargandoNodo: false,
  errorNodo: null,
  resultado: null,
  estadoDesconocido: false,
  error: null,
  requiereLogin: false,
});

const suscribirVacio = () => () => {};
const leerVacio = () => ESTADO_SIN_INTERVENCION;

export function useSosInterventionPage() {
  const navigate = useNavigate();
  const tituloRef = useRef(null);
  const outcomeRef = useRef(null);
  const errorRef = useRef(null);
  const [controlador, setControlador] = useState(() => intervencionSosActual());
  const [retorno, setRetorno] = useState(RETORNO_INACTIVO);
  const estado = useSyncExternalStore(
    controlador ? controlador.suscribir : suscribirVacio,
    controlador ? controlador.leer : leerVacio,
    controlador ? controlador.leer : leerVacio,
  );
  const { fase } = estado;
  const enCurso = fase === FASE_SOS.EN_CURSO;

  // Medición: la interfaz SOS ya está pintada (siguiente cuadro).
  useEffect(() => {
    if (!controlador || typeof requestAnimationFrame !== 'function') {
      return undefined;
    }

    const id = requestAnimationFrame(() => controlador.marcarInterfaz());

    return () => cancelAnimationFrame(id);
  }, [controlador]);

  // RF-43: la cuenta se recalcula con el límite del servidor; al volver a
  // la pestaña (los temporizadores se frenan en segundo plano) se recalcula
  // enseguida.
  useEffect(() => {
    if (!enCurso || !controlador) return undefined;

    const tick = () => controlador.tick();
    const id = setInterval(tick, INTERVALO_TICK_MS);

    document.addEventListener('visibilitychange', tick);
    window.addEventListener('pageshow', tick);
    window.addEventListener('focus', tick);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('pageshow', tick);
      window.removeEventListener('focus', tick);
    };
  }, [enCurso, controlador]);

  // 401: la sesión ya no es válida.
  useEffect(() => {
    if (estado.requiereLogin) navigate(LOGIN_PATH, { replace: true });
  }, [estado.requiereLogin, navigate]);

  // El título recibe el foco al abrir; el resultado, al cerrarse; un error
  // de activación o de cierre, en su bloque.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  useEffect(() => {
    if (fase === FASE_SOS.FINALIZADA) outcomeRef.current?.focus();
    if (
      fase === FASE_SOS.ERROR_ACTIVACION ||
      fase === FASE_SOS.ERROR_FINALIZACION
    ) {
      errorRef.current?.focus();
    }
  }, [fase]);

  function salir(ruta) {
    descartarIntervencionSos(controlador);
    navigate(ruta, { replace: true });
  }

  // RF-32: retoma la sesión pausada y comprueba que sea la misma, en el
  // mismo nodo. Si no, se avisa antes de abrir la que entregó el backend.
  async function reanudarChat(decision) {
    setRetorno({ estado: ESTADO_RETORNO.REANUDANDO });

    try {
      const reanudacion = await reanudarSesionPausada(decision);

      // La conversación reutiliza esta respuesta (solo en memoria).
      recordarInicioSesion(reanudacion.modelo);

      if (reanudacion.exacta) {
        salir(reanudacion.destino);
        return;
      }

      setRetorno({
        estado: ESTADO_RETORNO.NO_EXACTO,
        destino: reanudacion.destino,
        mismaSesion: reanudacion.mismaSesion,
      });
    } catch (error) {
      if (error?.status === 401) {
        navigate(LOGIN_PATH, { replace: true });
        return;
      }

      setRetorno({
        estado: ESTADO_RETORNO.ERROR,
        error: errorInicioParaConversacion(error),
      });
    }
  }

  const decision = decidirRetornoSos({
    resultado: estado.resultado,
    intervencion: estado.intervencion,
    contexto: controlador?.contexto ?? null,
  });

  function volver() {
    if (retorno.estado === ESTADO_RETORNO.REANUDANDO) return;
    if (retorno.estado === ESTADO_RETORNO.NO_EXACTO) {
      salir(retorno.destino);
      return;
    }
    if (decision.tipo === TIPO_RETORNO_SOS.REANUDAR_CHAT) {
      void reanudarChat(decision);
      return;
    }

    salir(decision.ruta);
  }

  // Tras F5 o una entrada directa no hay intervención en memoria: un
  // toque la inicia (sin contexto de origen).
  function empezar() {
    if (controlador) return;

    marcarToqueSos();
    setControlador(
      solicitarIntervencionSos({
        contexto: null,
        toque: RELOJ_NAVEGADOR.mono(),
      }),
    );
  }

  return {
    fase,
    restanteMs: estado.restanteMs,
    nodo: estado.nodo,
    claveFormulario: `${estado.nodo?.idNodo ?? 'sin-nodo'}-${estado.secuencia}`,
    enviando: estado.enviando,
    cargandoNodo: estado.cargandoNodo,
    errorNodo: estado.errorNodo,
    errorEnvio: estado.errorEnvio,
    errorEnvioEnLinea:
      estado.accionErrorEnvio === ACCION_ERROR_ENVIO_SOS.INLINE
        ? estado.errorEnvio
        : null,
    accionErrorEnvio: estado.accionErrorEnvio,
    error: estado.error,
    resultado: estado.resultado,
    estadoDesconocido: estado.estadoDesconocido,
    recursos: estado.intervencion?.recursos ?? [],
    retorno,
    reanudaChat: decision.tipo === TIPO_RETORNO_SOS.REANUDAR_CHAT,
    tituloRef,
    outcomeRef,
    errorRef,
    responder: (respuesta) => controlador?.responder(respuesta),
    reintentarEnvio: () => controlador?.reintentarEnvio(),
    reintentarNodo: () => controlador?.reintentarNodo(),
    reintentarActivacion: () => controlador?.reintentarActivacion(),
    cerrar: () => controlador?.cerrar(),
    reintentarFinalizacion: () => controlador?.reintentarFinalizacion(),
    volver,
    empezar,
    irAlInicio: () => salir(STUDENT_HOME_PATH),
  };
}
