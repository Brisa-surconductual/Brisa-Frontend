import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import {
  cargarDemoOffline,
  esDemoOfflineHabilitada,
} from '../../../demo/demoOffline.js';
import { useConectividad } from '../../../hooks/useConectividad.js';
import { useSincronizacionChat } from '../../../hooks/useSincronizacionChat.js';
import {
  alternarSimulacionConexion,
  useSimulacionConexion,
} from '../../../hooks/useSimulacionConexion.js';
import {
  listarColaSesion,
  listarSesionesLocales,
} from '../../../storage/index.js';
import { ESTADO_SINCRONIZACION } from '../../../types/index.js';

export const rutaConversacionOffline = (idSesion) =>
  `/app/estudiante/chat/sin-conexion/${encodeURIComponent(idSesion)}`;

const contar = (cola, estado) =>
  cola.filter((i) => i.estado_sincronizacion === estado).length;

// Sesiones locales del usuario con sus respuestas pendientes y con error.
async function leerSesiones(idUsuario) {
  const sesiones = await listarSesionesLocales(idUsuario);

  return Promise.all(
    sesiones.map(async (sesion) => {
      const cola = await listarColaSesion(sesion.id_sesion, idUsuario);

      return {
        idSesion: sesion.id_sesion,
        estado: sesion.estado_sesion_offline,
        ultimaSecuencia: sesion.ultima_secuencia,
        actualizadoEn: sesion.actualizado_en,
        pendientes: contar(
          cola,
          ESTADO_SINCRONIZACION.PENDIENTE_SINCRONIZACION,
        ),
        conError: contar(cola, ESTADO_SINCRONIZACION.ERROR_SINCRONIZACION),
      };
    }),
  );
}

/*
 * Entrada de la demostración sin conexión (solo desarrollo): crea una
 * sesión ficticia en IndexedDB, lista las ya guardadas del usuario para
 * reabrirlas y ofrece los controles de la sincronización simulada.
 */
export function useChatOfflineDemoPage() {
  const { idUsuario } = useAuth();
  const navigate = useNavigate();
  const habilitada = esDemoOfflineHabilitada();
  const [sesiones, setSesiones] = useState(null);
  const [error, setError] = useState(false);
  const [creando, setCreando] = useState(false);
  const simulada = useSimulacionConexion();
  const { conectividad, disponible, marcarFalloDeRed, limpiarFalloDeRed } =
    useConectividad({ simulada: habilitada && simulada });
  const sincronizacion = useSincronizacionChat({
    idUsuario,
    disponible,
    marcarFalloDeRed,
    limpiarFalloDeRed,
  });
  // La lista se relee cada vez que la sincronización publica un cambio.
  const estadoSync = sincronizacion.estado;

  useEffect(() => {
    if (!habilitada || !idUsuario) return undefined;

    let cancelado = false;

    leerSesiones(idUsuario)
      .then((lista) => {
        if (!cancelado) setSesiones(lista);
      })
      .catch(() => {
        if (!cancelado) setError(true);
      });

    return () => {
      cancelado = true;
    };
  }, [habilitada, idUsuario, estadoSync]);

  async function crearSesion() {
    if (creando) return;

    setCreando(true);
    setError(false);

    try {
      const demo = await cargarDemoOffline();
      const idSesion = await demo.prepararSesionDemoOffline(idUsuario);
      navigate(rutaConversacionOffline(idSesion));
    } catch {
      setError(true);
      setCreando(false);
    }
  }

  return {
    habilitada,
    sesiones,
    error,
    creando,
    crearSesion,
    conectividad,
    simulada,
    alternarSimulacion: alternarSimulacionConexion,
    sincronizacion,
    abrir: (idSesion) => navigate(rutaConversacionOffline(idSesion)),
    goChat: () => navigate('/app/estudiante/chat'),
  };
}
