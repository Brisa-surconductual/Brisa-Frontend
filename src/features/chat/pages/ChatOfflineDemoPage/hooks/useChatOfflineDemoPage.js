import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import {
  cargarDemoOffline,
  esDemoOfflineHabilitada,
} from '../../../demo/demoOffline.js';
import {
  listarPendientesSesion,
  listarSesionesLocales,
} from '../../../storage/index.js';

export const rutaConversacionOffline = (idSesion) =>
  `/app/estudiante/chat/sin-conexion/${encodeURIComponent(idSesion)}`;

// Sesiones locales del usuario con sus respuestas pendientes.
async function leerSesiones(idUsuario) {
  const sesiones = await listarSesionesLocales(idUsuario);

  return Promise.all(
    sesiones.map(async (sesion) => ({
      idSesion: sesion.id_sesion,
      estado: sesion.estado_sesion_offline,
      ultimaSecuencia: sesion.ultima_secuencia,
      actualizadoEn: sesion.actualizado_en,
      pendientes: (await listarPendientesSesion(sesion.id_sesion, idUsuario))
        .length,
    })),
  );
}

/*
 * Entrada de la demostración sin conexión (solo desarrollo): crea una
 * sesión ficticia en IndexedDB y lista las ya guardadas del usuario para
 * reabrirlas.
 */
export function useChatOfflineDemoPage() {
  const { idUsuario } = useAuth();
  const navigate = useNavigate();
  const habilitada = esDemoOfflineHabilitada();
  const [sesiones, setSesiones] = useState(null);
  const [error, setError] = useState(false);
  const [creando, setCreando] = useState(false);

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
  }, [habilitada, idUsuario]);

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
    abrir: (idSesion) => navigate(rutaConversacionOffline(idSesion)),
    goChat: () => navigate('/app/estudiante/chat'),
  };
}
