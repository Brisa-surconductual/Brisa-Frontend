import { TIPO_BLOQUE } from './tipoBloque.js';

// RF-33: estado de presentación de un recurso multimedia. Lo maneja solo
// el cliente. CORRUPTO y NO_DISPONIBLE_OFFLINE están diferidos (A-055,
// A-056 y RF-34): se declaran para que el catálogo quede completo.
export const ESTADO_RENDER = Object.freeze({
  CARGANDO: 'CARGANDO',
  MOSTRADO: 'MOSTRADO',
  NO_SOPORTADO: 'NO_SOPORTADO',
  ERROR_CARGA: 'ERROR_CARGA',
  NO_DISPONIBLE_OFFLINE: 'NO_DISPONIBLE_OFFLINE',
  CORRUPTO: 'CORRUPTO',
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
