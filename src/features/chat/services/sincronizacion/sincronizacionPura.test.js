import { describe, expect, it } from 'vitest';

import { createChatApiError } from '../../api/chatApiUtils.js';

import {
  ACCION_FALLO,
  calcularEsperaMs,
  clasificarFallo,
} from './fallosSincronizacion.js';
import {
  ARMADO_LOTE,
  construirLote,
  esLoteValido,
} from './loteSincronizacion.js';
import { interpretarResultados } from './resultadoSincronizacion.js';

const USUARIO = 'usuario-ficticio-a';
const SESION = '11111111-1111-4111-8111-111111111111';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const enCola = (secuencia, cambios = {}) => ({
  id_interaccion: id(secuencia),
  id_usuario: USUARIO,
  id_sesion: SESION,
  id_nodo: 'nodo-1',
  secuencia,
  tipo_entrada: 'ESCALA',
  valor: 5,
  timestamp_interaccion: '2026-11-13T21:10:00-05:00',
  estado_conectividad: 'SIN_CONEXION',
  recursos_no_presentados: [],
  id_nodo_destino_local: 'nodo-2',
  estado_sincronizacion: 'PENDIENTE_SINCRONIZACION',
  intentos: 0,
  ultimo_error: null,
  ...cambios,
});

const sesion = (ultima) => ({
  id_sesion: SESION,
  id_usuario: USUARIO,
  id_nodo_actual: 'nodo-9',
  ultima_secuencia: ultima,
  estado_sesion_offline: 'EN_CURSO',
});

describe('construcción del lote', () => {
  it('ordena por secuencia, no supone que empiece en 1 y solo lleva campos del contrato', () => {
    const armado = construirLote({
      sesion: sesion(43),
      cola: [enCola(43), enCola(41), enCola(42)],
    });

    expect(armado.tipo).toBe(ARMADO_LOTE.LOTE);
    expect(armado.interacciones.map((i) => i.secuencia)).toEqual([41, 42, 43]);
    expect(Object.keys(armado.interacciones[0]).sort()).toEqual([
      'estado_conectividad',
      'id_interaccion',
      'id_nodo',
      'recursos_no_presentados',
      'secuencia',
      'timestamp_interaccion',
      'tipo_entrada',
      'valor',
    ]);
    expect(armado.interacciones[0]).not.toHaveProperty('id_usuario');
  });

  it('corta en el tamaño máximo', () => {
    const cola = Array.from({ length: 5 }, (_, n) => enCola(n + 1));
    const armado = construirLote({ sesion: sesion(5), cola, tamanoMaximo: 2 });

    expect(armado.interacciones.map((i) => i.secuencia)).toEqual([1, 2]);
    expect(armado.pendientes).toBe(5);
  });

  it('cola vacía: no hay lote', () => {
    expect(construirLote({ sesion: sesion(3), cola: [] }).tipo).toBe(
      ARMADO_LOTE.VACIO,
    );
  });

  it.each([
    [
      'hueco en las secuencias',
      sesion(4),
      [enCola(1), enCola(2), enCola(4)],
      'SECUENCIA_INCONSISTENTE',
    ],
    [
      'secuencia repetida',
      sesion(2),
      [enCola(1), enCola(1, { id_interaccion: id(99) })],
      'SECUENCIA_INCONSISTENTE',
    ],
    [
      'pendiente posterior a la última secuencia local',
      sesion(1),
      [enCola(1), enCola(2)],
      'SECUENCIA_INCONSISTENTE',
    ],
    [
      'interacción de otro usuario',
      sesion(2),
      [enCola(1), enCola(2, { id_usuario: 'otro' })],
      'SECUENCIA_INCONSISTENTE',
    ],
    [
      'última secuencia desconocida',
      sesion(null),
      [enCola(1)],
      'SECUENCIA_NO_DETERMINADA',
    ],
    ['sin sesión local', null, [enCola(1)], 'SECUENCIA_NO_DETERMINADA'],
  ])('%s: bloqueo sin inventar nada', (_caso, laSesion, cola, estado) => {
    expect(construirLote({ sesion: laSesion, cola })).toMatchObject({
      tipo: ARMADO_LOTE.BLOQUEO,
      estado,
    });
  });

  it('con una interacción rechazada, la sesión queda pendiente de resolución', () => {
    const error = { codigo: 'FUERA_DE_RANGO', mensaje: 'x' };
    const armado = construirLote({
      sesion: sesion(3),
      cola: [
        enCola(2, {
          estado_sincronizacion: 'ERROR_SINCRONIZACION',
          ultimo_error: error,
        }),
        enCola(3),
      ],
    });

    expect(armado).toMatchObject({
      tipo: ARMADO_LOTE.BLOQUEO,
      estado: 'PENDIENTE_DE_RESOLUCION',
      error,
      pendientes: 1,
      conError: 1,
    });
  });

  it('esLoteValido: de 1 a 100, ascendente, sin huecos ni ids repetidos', () => {
    const lote = (secuencias) =>
      secuencias.map((s) => ({ id_interaccion: id(s), secuencia: s }));

    expect(esLoteValido(lote([7, 8, 9]))).toBe(true);
    expect(esLoteValido([])).toBe(false);
    expect(
      esLoteValido(lote(Array.from({ length: 101 }, (_, n) => n + 1))),
    ).toBe(false);
    expect(esLoteValido(lote([2, 1]))).toBe(false);
    expect(esLoteValido(lote([1, 3]))).toBe(false);
    expect(
      esLoteValido([
        { id_interaccion: 'a', secuencia: 1 },
        { id_interaccion: 'a', secuencia: 2 },
      ]),
    ).toBe(false);
  });
});

describe('interpretación de resultados', () => {
  const lote = [41, 42, 43, 44].map((s) => ({
    id_interaccion: id(s),
    secuencia: s,
  }));
  const fila = (s, resultado, extra = {}) => ({
    id_interaccion: id(s),
    secuencia: s,
    resultado,
    codigo: null,
    mensaje: null,
    ...extra,
  });

  it('el ejemplo del contrato: cada resultado a su destino', () => {
    const plan = interpretarResultados(lote, {
      resultados: [
        fila(41, 'SINCRONIZADA'),
        fila(42, 'DUPLICADA'),
        fila(43, 'RECHAZADA', {
          codigo: 'FUERA_DE_RANGO',
          mensaje: 'Fuera de rango.',
        }),
        fila(44, 'PENDIENTE'),
      ],
      resumen: {
        total: 4,
        sincronizadas: 1,
        duplicadas: 1,
        rechazadas: 1,
        pendientes: 1,
      },
      id_nodo_actual: 'nodo-7',
      estado_sesion: 'ACTIVA',
    });

    expect(plan).toEqual({
      valido: true,
      confirmadas: [id(41), id(42)],
      rechazadas: [
        {
          id_interaccion: id(43),
          codigo: 'FUERA_DE_RANGO',
          mensaje: 'Fuera de rango.',
        },
      ],
      pendientes: [id(44)],
      idNodoActual: 'nodo-7',
      estadoSesion: 'ACTIVA',
    });
  });

  it('una interacción sin resultado queda pendiente, no confirmada', () => {
    const plan = interpretarResultados(lote, {
      resultados: [fila(41, 'SINCRONIZADA')],
    });

    expect(plan.confirmadas).toEqual([id(41)]);
    expect(plan.pendientes).toEqual([id(42), id(43), id(44)]);
  });

  it.each([
    ['sin data', undefined],
    ['sin resultados', { id_nodo_actual: 'n' }],
    [
      'id ajeno al lote',
      { resultados: [{ ...fila(41, 'SINCRONIZADA'), id_interaccion: id(1) }] },
    ],
    [
      'id repetido',
      { resultados: [fila(41, 'SINCRONIZADA'), fila(41, 'SINCRONIZADA')] },
    ],
    [
      'otra secuencia',
      { resultados: [{ ...fila(41, 'SINCRONIZADA'), secuencia: 40 }] },
    ],
    ['resultado desconocido', { resultados: [fila(41, 'OK')] }],
    [
      'confirmada tras un rechazo',
      {
        resultados: [
          fila(41, 'RECHAZADA', { codigo: 'X' }),
          fila(42, 'SINCRONIZADA'),
        ],
      },
    ],
    [
      'confirmada tras una que falta',
      { resultados: [fila(42, 'SINCRONIZADA')] },
    ],
    ['rechazo sin código', { resultados: [fila(41, 'RECHAZADA')] }],
    [
      'resumen que no cuadra',
      {
        resultados: [fila(41, 'SINCRONIZADA')],
        resumen: {
          total: 1,
          sincronizadas: 0,
          duplicadas: 1,
          rechazadas: 0,
          pendientes: 0,
        },
      },
    ],
  ])('%s: no verificable, no se confirma nada', (_caso, data) => {
    expect(interpretarResultados(lote, data)).toMatchObject({ valido: false });
  });
});

describe('fallos y backoff', () => {
  it.each([
    ['LOTE_INVALIDO', ACCION_FALLO.NO_REINTENTAR],
    ['NO_AUTENTICADO', ACCION_FALLO.ESPERAR_AUTENTICACION],
    ['CSRF_INVALIDO', ACCION_FALLO.RENOVAR_CSRF],
    ['SESION_NO_ENCONTRADA', ACCION_FALLO.MARCAR_ERROR],
    ['ERROR_SINCRONIZACION', ACCION_FALLO.REINTENTAR],
    ['SIN_CONEXION', ACCION_FALLO.SIN_RESPUESTA],
    ['ALGO_NUEVO', ACCION_FALLO.REINTENTAR],
  ])('%s → %s', (code, accion) => {
    expect(clasificarFallo(createChatApiError({ code }))).toBe(accion);
  });

  it('exponencial de 2 s a 5 min, configurable', () => {
    expect([1, 2, 3, 4, 8, 9, 20].map((n) => calcularEsperaMs(n))).toEqual([
      2_000, 4_000, 8_000, 16_000, 256_000, 300_000, 300_000,
    ]);
    expect(
      calcularEsperaMs(3, { esperaInicialMs: 100, esperaMaximaMs: 250 }),
    ).toBe(250);
  });
});
