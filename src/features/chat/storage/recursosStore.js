import { capturadaEn } from '../utils/capturadaEn.js';

import { ALMACEN } from './brisaChatDb.js';
import {
  ESCRITURA,
  LECTURA,
  ejecutarTransaccion,
  pedir,
} from './transaccion.js';
import { esEnteroNoNegativo, esTexto, exigir } from './validacionRegistro.js';

const { RECURSOS } = ALMACEN;

/*
 * Almacén `recursos` (clave `id_recurso`): archivos multimedia ya
 * descargados por la precarga (tarea 2). El contrato no asocia los
 * recursos a un usuario: son contenido del programa, no datos personales,
 * y se borran completos al cerrar sesión.
 *
 * La comprobación de integridad (tamaño y MIME del archivo frente a
 * `tamano_bytes` y `mime_type`, estado CORRUPTO) corresponde a la
 * descarga multimedia; aquí solo se exige la forma del registro.
 */
function aRegistro(recurso, ahora) {
  exigir(recurso !== null && typeof recurso === 'object');

  const registro = {
    id_recurso: recurso.id_recurso,
    mime_type: recurso.mime_type,
    tamano_bytes: recurso.tamano_bytes,
    blob: recurso.blob,
    descargado_en: recurso.descargado_en ?? capturadaEn(ahora),
  };

  exigir(esTexto(registro.id_recurso));
  exigir(esTexto(registro.mime_type));
  exigir(esEnteroNoNegativo(registro.tamano_bytes));
  exigir(typeof Blob !== 'undefined' && registro.blob instanceof Blob);
  exigir(esTexto(registro.descargado_en));

  return registro;
}

export async function guardarRecurso(recurso, { ahora = new Date() } = {}) {
  const registro = aRegistro(recurso, ahora);

  await ejecutarTransaccion([RECURSOS], ESCRITURA, (tx) =>
    pedir(tx.objectStore(RECURSOS).put(registro)),
  );

  return registro;
}

// null si el recurso no está en el dispositivo.
export async function obtenerRecurso(idRecurso) {
  exigir(esTexto(idRecurso));

  const recurso = await ejecutarTransaccion([RECURSOS], LECTURA, (tx) =>
    pedir(tx.objectStore(RECURSOS).get(idRecurso)),
  );

  return recurso ?? null;
}
