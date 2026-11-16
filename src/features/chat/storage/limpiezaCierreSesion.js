import { ALMACEN } from './brisaChatDb.js';
import { ESCRITURA, ejecutarTransaccion, pedir } from './transaccion.js';

/*
 * Regla 4 y D5: al cerrar sesión se borran `paquetes` y `recursos`, en
 * una sola transacción. `cola_interacciones` y `sesiones_locales` se
 * conservan: tras el nuevo login se sincroniza solo la cola del usuario
 * que coincida.
 *
 * E3-B1 solo expone la función; conectarla al cierre de sesión queda
 * para una etapa posterior.
 */
export function limpiarDatosOfflineAlCerrarSesion() {
  return ejecutarTransaccion(
    [ALMACEN.PAQUETES, ALMACEN.RECURSOS],
    ESCRITURA,
    async (tx) => {
      await pedir(tx.objectStore(ALMACEN.PAQUETES).clear());
      await pedir(tx.objectStore(ALMACEN.RECURSOS).clear());
    },
  );
}
