import { TIPO_ENTRADA } from './tipoEntrada.js';

export const PRESENTACION = Object.freeze({
  TARJETAS: 'TARJETAS',
  SILUETA: 'SILUETA',
});

export const PRESENTACION_COMPATIBLE = Object.freeze({
  [PRESENTACION.TARJETAS]: Object.freeze([
    TIPO_ENTRADA.SELECCION_UNICA,
    TIPO_ENTRADA.SELECCION_MULTIPLE,
  ]),
  // Contrato 2.3.1: SILUETA solo admite selección múltiple
  [PRESENTACION.SILUETA]: Object.freeze([TIPO_ENTRADA.SELECCION_MULTIPLE]),
});

// Contrato 2.3.1: valores permitidos en `opciones` cuando la presentación es
// SILUETA (las zonas que dibuja el frontend).
export const ZONA_SILUETA = Object.freeze({
  CABEZA: 'CABEZA',
  GARGANTA: 'GARGANTA',
  PECHO: 'PECHO',
  ABDOMEN: 'ABDOMEN',
  MANOS: 'MANOS',
});
