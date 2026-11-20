import { useEffect, useRef, useState } from 'react';

import {
  cargarDemoSincronizacion,
  esDemoOfflineHabilitada,
} from '../demo/demoOffline.js';
import { crearCoordinadorSincronizacion } from '../services/sincronizacion/coordinadorSincronizacion.js';
import { MOTIVO_SINCRONIZACION } from '../types/index.js';

const { CONEXION, FOCO, MANUAL } = MOTIVO_SINCRONIZACION;

/*
 * Sincronización de interacciones diferidas (tarea 4) mientras la
 * pantalla está montada. Hoy solo existe con el SIMULADOR de la
 * demostración (modo desarrollo + VITE_CHAT_OFFLINE_DEMO): sin él no hay
 * transporte, no se crea el coordinador y nada se confirma ni se borra.
 *
 * Disparos: al montar con usuario (equivale al inicio de sesión), al
 * volver la conexión, al volver el foco y cada 60 s (en el coordinador).
 * Al perder la conexión corta el envío en curso; al desmontar, detiene
 * todo y limpia temporizadores y suscripciones.
 */
export function useSincronizacionChat({
  idUsuario,
  disponible,
  marcarFalloDeRed,
  limpiarFalloDeRed,
}) {
  const habilitada = esDemoOfflineHabilitada();
  const [modulo, setModulo] = useState(null);
  const [estado, setEstado] = useState(null);
  // Instantánea del simulador: leerlo en el render no se actualizaría.
  const [vistaSimulador, setVistaSimulador] = useState(null);
  const coordinadorRef = useRef(null);
  const disponibleRef = useRef(disponible);
  const avisosRef = useRef({ marcarFalloDeRed, limpiarFalloDeRed });
  const disponiblePrevioRef = useRef(disponible);

  useEffect(() => {
    disponibleRef.current = disponible;
    avisosRef.current = { marcarFalloDeRed, limpiarFalloDeRed };
  });

  useEffect(() => {
    if (!habilitada) return undefined;

    let cancelado = false;

    cargarDemoSincronizacion()
      .then((cargado) => {
        if (!cancelado && cargado) setModulo(cargado);
      })
      .catch(() => {
        // Sin simulador no hay sincronización: la cola queda intacta.
      });

    return () => {
      cancelado = true;
    };
  }, [habilitada]);

  useEffect(() => {
    if (!modulo || !idUsuario) return undefined;

    const simulador = modulo.obtenerSimulador();
    simulador.configurar({ conexionDisponible: () => disponibleRef.current });

    const coordinador = crearCoordinadorSincronizacion({
      idUsuario,
      transporte: simulador.crearTransporte(idUsuario),
      conexionDisponible: () => disponibleRef.current,
      alCambiar: setEstado,
      alFalloDeRed: () => avisosRef.current.marcarFalloDeRed(),
      alRespuesta: () => avisosRef.current.limpiarFalloDeRed(),
    });
    const leerSimulador = () =>
      setVistaSimulador({
        escenario: simulador.escenario(),
        estadisticas: simulador.estadisticas(),
      });
    const dejarDeOir = simulador.suscribir(leerSimulador);
    leerSimulador();

    coordinadorRef.current = coordinador;
    coordinador.iniciar();

    return () => {
      dejarDeOir();
      coordinador.detener();
      coordinadorRef.current = null;
      setEstado(null);
      setVistaSimulador(null);
    };
  }, [modulo, idUsuario]);

  useEffect(() => {
    const previo = disponiblePrevioRef.current;
    disponiblePrevioRef.current = disponible;

    if (previo === disponible) return;
    if (disponible) coordinadorRef.current?.solicitar(CONEXION);
    else coordinadorRef.current?.interrumpir();
  }, [disponible]);

  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'hidden') return;
      coordinadorRef.current?.solicitar(FOCO);
    };

    window.addEventListener('focus', alVolver);
    document.addEventListener('visibilitychange', alVolver);

    return () => {
      window.removeEventListener('focus', alVolver);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, []);

  const activa = Boolean(modulo && idUsuario);

  return {
    activa,
    // Toda confirmación de hoy es simulada (no hay servicio real).
    simulada: activa,
    estado,
    sincronizarAhora: () => coordinadorRef.current?.solicitar(MANUAL),
    simulador: activa &&
      vistaSimulador && {
        ...vistaSimulador,
        elegirEscenario: (valor) =>
          modulo.obtenerSimulador().elegirEscenario(valor),
        opciones: Object.entries(modulo.ETIQUETA_ESCENARIO).map(
          ([valor, etiqueta]) => ({ valor, etiqueta }),
        ),
      },
  };
}
