import { describe, expect, it } from 'vitest';

import * as chat from '../index.js';

const {
  PRESENTACION,
  PRESENTACION_COMPATIBLE,
  RESULTADO_SINCRONIZACION,
  RESULTADO_SINCRONIZACION_EXITOSO,
  TIPO_ENTRADA,
  TIPO_NODO,
} = chat;

const CATALOGOS = [
  'TIPO_NODO',
  'TIPO_ENTRADA',
  'ALIAS_TIPO_ENTRADA',
  'FORMATO_FECHA',
  'PRESENTACION',
  'PRESENTACION_COMPATIBLE',
  'ZONA_SILUETA',
  'ESTADO_SESION',
  'MODALIDAD',
  'ESTADO_SINCRONIZACION',
  'RESULTADO_SINCRONIZACION',
  'RESULTADO_SINCRONIZACION_EXITOSO',
  'ESTADO_PRECARGA',
  'ESTADO_CONECTIVIDAD',
  'CATEGORIA_ERROR_CHAT',
  'CHAT_ERROR_CODE',
  'ESTADO_RENDER',
  'MIME_PERMITIDOS',
  'AVISO_MULTIMEDIA',
];

const isDeepFrozen = (value) =>
  typeof value !== 'object' ||
  (Object.isFrozen(value) && Object.values(value).every(isDeepFrozen));

describe('barril de features/chat', () => {
  it.each(CATALOGOS)('%s se importa y está congelado a fondo', (nombre) => {
    expect(chat[nombre]).toBeDefined();
    expect(isDeepFrozen(chat[nombre])).toBe(true);
  });
});

describe('fidelidad al contrato', () => {
  it('TIPO_ENTRADA son los nombres canónicos de A-014', () => {
    expect(Object.values(TIPO_ENTRADA).sort()).toEqual(
      [
        'OPCION_UNICA',
        'MULTISELECCION',
        'ESCALA',
        'NUMERICO',
        'FECHA_HORA',
        'BOOLEANO',
        'TEXTO_LIBRE',
        'CONTINUAR',
      ].sort(),
    );
  });

  it('TIPO_NODO tiene exactamente 2 valores', () => {
    expect(Object.values(TIPO_NODO)).toHaveLength(2);
  });

  it('DUPLICADO cuenta como sincronización exitosa', () => {
    expect(RESULTADO_SINCRONIZACION_EXITOSO).toContain(
      RESULTADO_SINCRONIZACION.DUPLICADO,
    );
  });
});

describe('PRESENTACION_COMPATIBLE', () => {
  it('SILUETA solo admite MULTISELECCION', () => {
    expect(PRESENTACION_COMPATIBLE[PRESENTACION.SILUETA]).toEqual([
      TIPO_ENTRADA.MULTISELECCION,
    ]);
  });

  it('TARJETAS admite selección única y múltiple', () => {
    expect([...PRESENTACION_COMPATIBLE[PRESENTACION.TARJETAS]].sort()).toEqual(
      [TIPO_ENTRADA.MULTISELECCION, TIPO_ENTRADA.OPCION_UNICA].sort(),
    );
  });

  it.each([
    TIPO_ENTRADA.ESCALA,
    TIPO_ENTRADA.NUMERICO,
    TIPO_ENTRADA.FECHA_HORA,
    TIPO_ENTRADA.BOOLEANO,
    TIPO_ENTRADA.TEXTO_LIBRE,
  ])('ninguna presentación admite %s', (tipo) => {
    expect(Object.values(PRESENTACION_COMPATIBLE).flat()).not.toContain(tipo);
  });
});

describe('estadoRender (RF-33 v1.1)', () => {
  it('no tiene estado sin conexión (A-062)', () => {
    expect(Object.keys(chat.ESTADO_RENDER)).not.toContain(
      'NO_DISPONIBLE_OFFLINE',
    );
  });

  it('los textos del flujo alterno son VERBATIM', () => {
    const { AVISO_MULTIMEDIA: A, ESTADO_RENDER: R } = chat;

    expect(A[R.ERROR_CARGA]).toBe(
      'No fue posible cargar el contenido multimedia.',
    );
    expect(A[R.NO_SOPORTADO]).toBe(
      'El formato del contenido multimedia no es soportado.',
    );
    expect(A[R.CORRUPTO]).toBe(
      'El recurso multimedia está dañado o incompleto.',
    );
    expect(A.NO_ENCONTRADO).toBe('El recurso multimedia no está disponible.');
  });
});
