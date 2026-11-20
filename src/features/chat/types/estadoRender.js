import { TIPO_BLOQUE } from './tipoBloque.js';

// RF-33: estado de presentación de un recurso multimedia. Lo maneja solo
// el cliente. CORRUPTO está diferido (A-055, A-056): se declara para que
// el catálogo quede completo. La operación sin conexión salió del alcance
// (A-062), así que no hay estado offline.
export const ESTADO_RENDER = Object.freeze({
  CARGANDO: 'CARGANDO',
  MOSTRADO: 'MOSTRADO',
  NO_SOPORTADO: 'NO_SOPORTADO',
  ERROR_CARGA: 'ERROR_CARGA',
  CORRUPTO: 'CORRUPTO',
});

// RF-33 v1.1, flujo alterno: textos VERBATIM. Sin CORS no se sabe si un
// fallo fue un 404 (A-056), así que todo fallo usa el de ERROR_CARGA
// (enmienda D16). NO_ENCONTRADO queda sin uso hasta resolver A-056.
export const AVISO_MULTIMEDIA = Object.freeze({
  [ESTADO_RENDER.ERROR_CARGA]: 'No fue posible cargar el contenido multimedia.',
  [ESTADO_RENDER.NO_SOPORTADO]:
    'El formato del contenido multimedia no es soportado.',
  [ESTADO_RENDER.CORRUPTO]: 'El recurso multimedia está dañado o incompleto.',
  NO_ENCONTRADO: 'El recurso multimedia no está disponible.',
});

// Lista provisional mientras se define P1 (A-057). Sin tamaño máximo:
// el contrato aún no trae `tamanoBytes` (A-055).
export const MIME_PERMITIDOS = Object.freeze({
  [TIPO_BLOQUE.IMAGEN]: Object.freeze([
    'image/webp',
    'image/png',
    'image/jpeg',
    'image/gif',
  ]),
  [TIPO_BLOQUE.GIF]: Object.freeze(['image/gif']),
  [TIPO_BLOQUE.VIDEO]: Object.freeze(['video/mp4', 'video/webm']),
});
