import { describe, expect, it } from 'vitest';

import {
  contextoRetornoSeguro,
  crearContextoOrigen,
  moduloDeRuta,
  rutaRetornoSegura,
} from './contextoOrigenSos.js';
import {
  enlaceTelefono,
  mapActivacionSos,
  mapFinalizacionSos,
  mapRecursosApoyo,
} from './respuestaSos.js';
import {
  describirRestante,
  duracionServidorMs,
  formatearDuracion,
  formatearRestante,
} from './tiempoSos.js';

describe('contexto de origen (ampliación B)', () => {
  it.each([
    ['/app/estudiante/chat', 'CHAT'],
    ['/app/estudiante/chat/sesion/abc', 'CHAT'],
    ['/app/estudiante/cronograma/contenido-vigente', 'CONTENIDO'],
    ['/app/estudiante/cronograma/otra', 'CRONOGRAMA'],
    ['/app/estudiante/diario/nuevo', 'DIARIO'],
    ['/app/estudiante/perfil', 'PERFIL'],
    ['/app/estudiante', 'OTRO'],
    ['/app/estudiante/chatx', 'OTRO'],
  ])('%s → %s', (ruta, modulo) => expect(moduloDeRuta(ruta)).toBe(modulo));

  it('captura ruta y consulta, sin fragmento ni estado', () => {
    expect(
      crearContextoOrigen({
        pathname: '/app/estudiante/chat/sesion/s1',
        search: '?a=1',
        hash: '#x',
      }),
    ).toEqual({
      modulo: 'CHAT',
      ruta: '/app/estudiante/chat/sesion/s1?a=1',
      estado: null,
    });
  });

  it('fuera del área del estudiante no hay contexto', () => {
    expect(crearContextoOrigen({ pathname: '/app/administrativo' })).toBeNull();
  });

  it.each(['/app/estudiante/chat', '/app/estudiante?x=1'])(
    'acepta la ruta interna %s',
    (ruta) => expect(rutaRetornoSegura(ruta)).toBe(ruta),
  );

  it.each([
    'https://malicioso.example/app/estudiante',
    '//malicioso.example',
    '/app/estudiante//x',
    '/app/estudiante/../administrativo',
    '/app/estudiante\\x',
    '/app/estudiante/#x',
    '/app/estudiantes',
    '/app/administrativo',
    '/app/estudiante/sos',
    'javascript:alert(1)',
    `/app/estudiante/${'x'.repeat(600)}`,
    null,
  ])('rechaza %s', (ruta) => expect(rutaRetornoSegura(ruta)).toBeNull());

  it('el contexto de retorno del backend se valida', () => {
    expect(
      contextoRetornoSeguro({
        modulo: 'DIARIO',
        ruta: '/app/estudiante/diario',
        estado: { a: 1 },
      }),
    ).toEqual({ modulo: 'DIARIO', ruta: '/app/estudiante/diario' });
    expect(
      contextoRetornoSeguro({ modulo: 'X', ruta: '/app/estudiante' }),
    ).toBeNull();
    expect(
      contextoRetornoSeguro({ modulo: 'CHAT', ruta: 'https://x.example' }),
    ).toBeNull();
    expect(contextoRetornoSeguro(null)).toBeNull();
  });
});

describe('tiempo', () => {
  it('la duración sale de las marcas del servidor', () => {
    expect(
      duracionServidorMs(
        '2026-11-20T04:40:00-05:00',
        '2026-11-20T04:41:00-05:00',
      ),
    ).toBe(60_000);
    expect(
      duracionServidorMs(
        '2026-11-20T04:41:00-05:00',
        '2026-11-20T04:40:00-05:00',
      ),
    ).toBeNull();
    expect(duracionServidorMs('x', '2026-11-20T04:40:00-05:00')).toBeNull();
  });

  it('formatos', () => {
    expect(formatearRestante(45_000)).toBe('0:45');
    expect(formatearRestante(44_001)).toBe('0:45');
    expect(formatearRestante(0)).toBe('0:00');
    expect(formatearRestante(60_000)).toBe('1:00');
    expect(describirRestante(1_000)).toBe('1 segundo');
    expect(formatearDuracion(15)).toBe('15 segundos');
    expect(formatearDuracion(60)).toBe('1 minuto');
    expect(formatearDuracion(null)).toBeNull();
  });
});

describe('respuestas del backend', () => {
  const activacion = {
    id_intervencion: 'a0000000-0000-4000-8000-000000000001',
    id_sesion_sos: 'b0000000-0000-4000-8000-000000000002',
    sesion_pausada: null,
    inicio_servidor: '2026-11-20T04:40:00-05:00',
    fin_maximo_servidor: '2026-11-20T04:41:00-05:00',
    nodo_actual: {
      id_nodo: 'n1',
      tipo_nodo: 'MENSAJE',
      es_terminal: false,
      disponibilidad: { habilitado: true, habilita_aprox: null },
      bloques: [
        { orden: 2, tipo: 'TEXTO', texto: 'b' },
        { orden: 1, tipo: 'TEXTO', texto: 'a' },
      ],
      entrada: null,
    },
    recursos_apoyo: [],
    contexto_origen: null,
  };

  it('el nodo usa el modelo RF-26 (bloques ordenados, texto intacto)', () => {
    const modelo = mapActivacionSos(activacion);

    expect(modelo.duracionMs).toBe(60_000);
    expect(modelo.nodo.bloques.map((b) => b.texto)).toEqual(['a', 'b']);
    expect(modelo.sesionPausada).toBeNull();
  });

  it.each([
    'id_intervencion',
    'id_sesion_sos',
    'nodo_actual',
    'inicio_servidor',
  ])('sin %s la activación no es válida', (campo) =>
    expect(mapActivacionSos({ ...activacion, [campo]: undefined })).toBeNull(),
  );

  it('recursos: se conservan tal cual; los que no tienen nombre se descartan', () => {
    expect(
      mapRecursosApoyo([
        { nombre: 'Línea 106', telefono: '106' },
        { nombre: '', telefono: '1' },
        null,
        { nombre: 'USCO', telefono: 'POR_CONFIRMAR' },
      ]),
    ).toEqual([
      { nombre: 'Línea 106', telefono: '106' },
      { nombre: 'USCO', telefono: 'POR_CONFIRMAR' },
    ]);
    expect(mapRecursosApoyo(undefined)).toEqual([]);
  });

  it('finalizar: estado, duración y sesión pausada del servidor', () => {
    expect(
      mapFinalizacionSos({
        duracion_segundos: 15,
        estado: 'INCOMPLETA',
        sesion_pausada: {
          id_sesion: activacion.id_intervencion,
          id_nodo_actual: 'n9',
        },
        contexto_retorno: null,
      }),
    ).toEqual({
      estado: 'INCOMPLETA',
      duracionSegundos: 15,
      sesionPausada: {
        idSesion: activacion.id_intervencion,
        idNodoActual: 'n9',
      },
      contextoRetorno: null,
    });
    expect(mapFinalizacionSos({ duracion_segundos: 3 })).toBeNull();
  });

  it.each([
    ['106', 'tel:106'],
    ['+57 601 123-4567', 'tel:+576011234567'],
    ['POR_CONFIRMAR', null],
    ['javascript:alert(1)', null],
    ['', null],
    [null, null],
  ])('enlace telefónico de %s', (telefono, href) =>
    expect(enlaceTelefono(telefono)).toBe(href),
  );
});
