import {
  guardarPaquete,
  guardarRecurso,
  guardarSesionLocal,
} from '../storage/index.js';
import { ESTADO_SESION_OFFLINE } from '../types/index.js';
import { nuevoUuid } from '../utils/nuevoUuid.js';

import {
  ID_NODO_INICIAL_DEMO,
  ID_RECURSO_DEMO_GUARDADO,
  PAQUETE_DEMO_OFFLINE,
} from './paqueteDemoOffline.js';

/*
 * Solo desarrollo: deja en IndexedDB una sesión de demostración del
 * usuario autenticado, como lo haría la precarga (tarea 2), que todavía
 * no existe. La sesión es nueva y ficticia: nunca tuvo respuestas en
 * línea, por eso su última secuencia es 0. Cada llamada crea otra sesión.
 */
export async function prepararSesionDemoOffline(idUsuario) {
  const idSesion = nuevoUuid();

  await guardarRecurso({
    id_recurso: ID_RECURSO_DEMO_GUARDADO,
    mime_type: 'text/plain',
    tamano_bytes: 4,
    blob: new Blob(['demo'], { type: 'text/plain' }),
  });
  await guardarPaquete({
    ...PAQUETE_DEMO_OFFLINE,
    id_sesion: idSesion,
    id_usuario: idUsuario,
  });
  await guardarSesionLocal({
    id_sesion: idSesion,
    id_usuario: idUsuario,
    id_nodo_actual: ID_NODO_INICIAL_DEMO,
    ultima_secuencia: 0,
    estado_sesion_offline: ESTADO_SESION_OFFLINE.EN_CURSO,
  });

  return idSesion;
}
