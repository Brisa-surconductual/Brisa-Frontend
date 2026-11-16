import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cerrarBrisaChatDb } from './brisaChatDb.js';
import {
  encolarInteraccion,
  listarColaSesion,
} from './colaInteraccionesStore.js';
import {
  SESION_1,
  USUARIO_A,
  interaccion,
  paquete,
  reiniciarIndexedDb,
  sesionLocal,
} from './entornoPruebas.js';
import { limpiarDatosOfflineAlCerrarSesion } from './limpiezaCierreSesion.js';
import { guardarPaquete, obtenerPaquete } from './paquetesStore.js';
import { guardarRecurso, obtenerRecurso } from './recursosStore.js';
import {
  guardarSesionLocal,
  obtenerSesionLocal,
} from './sesionesLocalesStore.js';

beforeEach(reiniciarIndexedDb);
afterEach(cerrarBrisaChatDb);

describe('limpieza al cerrar sesión (regla 4, D5)', () => {
  it('borra paquetes y recursos y conserva la cola y las sesiones locales', async () => {
    await guardarPaquete(paquete());
    await guardarRecurso({
      id_recurso: 'recurso-ficticio',
      mime_type: 'image/webp',
      tamano_bytes: 1,
      blob: new Blob(['a'], { type: 'image/webp' }),
    });
    await guardarSesionLocal(sesionLocal());
    await encolarInteraccion(interaccion());

    await limpiarDatosOfflineAlCerrarSesion();

    expect(await obtenerPaquete(SESION_1, USUARIO_A)).toBeNull();
    expect(await obtenerRecurso('recurso-ficticio')).toBeNull();
    expect(await obtenerSesionLocal(SESION_1, USUARIO_A)).toMatchObject({
      ultima_secuencia: 1,
    });
    expect(await listarColaSesion(SESION_1, USUARIO_A)).toHaveLength(1);
  });

  it('con la base vacía no falla', async () => {
    await expect(limpiarDatosOfflineAlCerrarSesion()).resolves.toBeUndefined();
  });
});
