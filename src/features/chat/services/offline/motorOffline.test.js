import { describe, expect, it } from 'vitest';

import { NODOS_DEMO_OFFLINE } from '../../demo/paqueteDemoOffline.js';

import { DECISION_OFFLINE, decidirRespuestaOffline } from './motorOffline.js';
import { aNodoInterfaz } from './nodoPaquete.js';
import {
  RESULTADO_TRANSICION,
  elegirTransicionLocal,
} from './transicionLocal.js';
import {
  RESULTADO_VALIDACION,
  validarRespuestaLocal,
} from './validacionLocal.js';

const ENTERO = Object.freeze({
  tipo_dato: 'ENTERO',
  obligatorio: true,
  valor_min: 1,
  valor_max: 10,
  formato_regex: null,
  valores_permitidos: null,
  mensaje_error: 'Mensaje ficticio de rango.',
});

const validar = (validacion, valor, informativo = false) =>
  validarRespuestaLocal({ validacion, informativo }, valor);

describe('validación local (contrato 5a)', () => {
  it.each([1, 5, 10])('ENTERO dentro del rango: %s es válido', (valor) => {
    expect(validar(ENTERO, valor).resultado).toBe(RESULTADO_VALIDACION.VALIDA);
  });

  it.each([
    [0, 'FUERA_DE_RANGO'],
    [11, 'FUERA_DE_RANGO'],
    [2.5, 'TIPO_DATO_INVALIDO'],
    ['7', 'TIPO_DATO_INVALIDO'],
    [null, 'RESPUESTA_OBLIGATORIA'],
    ['  ', 'RESPUESTA_OBLIGATORIA'],
  ])('%s es inválido (%s) con el mensaje del paquete', (valor, codigo) => {
    expect(validar(ENTERO, valor)).toEqual({
      resultado: 'INVALIDA',
      codigo,
      mensaje: 'Mensaje ficticio de rango.',
    });
  });

  it('no obligatorio: vacío es válido', () => {
    expect(validar({ ...ENTERO, obligatorio: false }, null).resultado).toBe(
      'VALIDA',
    );
  });

  it('sin mensaje en el paquete usa uno genérico', () => {
    expect(validar({ ...ENTERO, mensaje_error: null }, 0).mensaje).toBe(
      'La respuesta no es válida.',
    );
  });

  it.each([
    ['otro tipo de dato', { ...ENTERO, tipo_dato: 'TEXTO' }],
    ['formato_regex', { ...ENTERO, formato_regex: '^\\d+$' }],
    ['valores_permitidos', { ...ENTERO, valores_permitidos: ['1'] }],
    ['obligatorio no booleano', { ...ENTERO, obligatorio: 'si' }],
    ['límite no numérico', { ...ENTERO, valor_min: '1' }],
  ])(
    'regla no soportada (%s): no se acepta en silencio',
    (_caso, validacion) => {
      expect(validar(validacion, 5).resultado).toBe(
        RESULTADO_VALIDACION.NO_SOPORTADA,
      );
    },
  );

  it('nodo con entrada y sin validación: no soportada; informativo sin validación: válido', () => {
    expect(validar(null, 5).resultado).toBe('NO_SOPORTADA');
    expect(validar(null, null, true).resultado).toBe('VALIDA');
  });
});

const entre = (orden, rango, destino) => ({
  orden_evaluacion: orden,
  operador: 'ENTRE',
  valor_condicion: rango,
  id_nodo_destino: destino,
});
const siempre = (orden, destino) => ({
  orden_evaluacion: orden,
  operador: 'SIEMPRE',
  valor_condicion: null,
  id_nodo_destino: destino,
});

describe('transición local: primera que se cumple según orden_evaluacion', () => {
  const transiciones = [siempre(2, 'b'), entre(1, [7, 10], 'a')];

  it.each([
    [7, 'a'],
    [10, 'a'],
    [6, 'b'],
    [null, 'b'],
  ])(
    'valor %s → %s (límites incluidos, ordena por orden_evaluacion)',
    (valor, destino) => {
      expect(elegirTransicionLocal(transiciones, valor)).toEqual({
        resultado: 'DESTINO',
        idNodoDestino: destino,
      });
    },
  );

  it('ninguna se cumple: SIN_TRANSICION', () => {
    expect(elegirTransicionLocal([entre(1, [7, 10], 'a')], 3).resultado).toBe(
      RESULTADO_TRANSICION.SIN_TRANSICION,
    );
  });

  it.each([
    [
      'operador del backend',
      [
        {
          orden_evaluacion: 1,
          operador: 'RANGO',
          valor_condicion: { min: 1 },
          id_nodo_destino: 'a',
        },
      ],
    ],
    [
      'operador desconocido antes del que se cumpliría',
      [
        {
          orden_evaluacion: 1,
          operador: 'IGUALDAD',
          valor_condicion: 5,
          id_nodo_destino: 'a',
        },
        siempre(2, 'b'),
      ],
    ],
    ['intervalo mal formado', [entre(1, [10, 7], 'a')]],
    ['SIEMPRE con condición', [{ ...siempre(1, 'a'), valor_condicion: 1 }]],
    ['órdenes repetidos', [siempre(1, 'a'), siempre(1, 'b')]],
    ['sin lista', null],
  ])('no soportada (%s): no adivina el destino', (_caso, lista) => {
    expect(elegirTransicionLocal(lista, 5).resultado).toBe(
      RESULTADO_TRANSICION.NO_SOPORTADA,
    );
  });

  it('una regla anterior que se cumple no depende de las posteriores', () => {
    const lista = [
      siempre(1, 'a'),
      {
        orden_evaluacion: 2,
        operador: 'CATEGORIA',
        valor_condicion: {},
        id_nodo_destino: 'b',
      },
    ];
    expect(elegirTransicionLocal(lista, 5).idNodoDestino).toBe('a');
  });
});

describe('nodo del paquete → modelo de interfaz', () => {
  it('pinta solo el texto y aparta los recursos', () => {
    const { nodo, idsRecurso } = aNodoInterfaz(NODOS_DEMO_OFFLINE[0]);

    expect(nodo.idNodo).toBe('demo-nodo-bienvenida');
    expect(nodo.bloques.map((b) => b.tipo)).toEqual(['TEXTO']);
    expect(idsRecurso).toEqual([
      'demo-recurso-guardado',
      'demo-recurso-ausente',
    ]);
  });
});

describe('motor offline', () => {
  const paquete = { nodos: NODOS_DEMO_OFFLINE };

  it('respuesta válida con destino presente: AVANZAR con tipo y valor', () => {
    expect(decidirRespuestaOffline(paquete, 'demo-nodo-escala', 3)).toEqual({
      tipo: DECISION_OFFLINE.AVANZAR,
      tipoEntrada: 'ESCALA',
      valor: 3,
      idNodoDestino: 'demo-nodo-respiracion',
      destinoTerminal: false,
    });
  });

  it('nodo informativo: CONTINUAR con valor null aunque llegue otro', () => {
    expect(
      decidirRespuestaOffline(paquete, 'demo-nodo-bienvenida', 'x'),
    ).toMatchObject({
      tipoEntrada: 'CONTINUAR',
      valor: null,
      idNodoDestino: 'demo-nodo-escala',
    });
  });

  it('destino terminal: marca el final de la conversación', () => {
    expect(
      decidirRespuestaOffline(paquete, 'demo-nodo-numero', 4),
    ).toMatchObject({
      idNodoDestino: 'demo-nodo-cierre',
      destinoTerminal: true,
    });
  });

  it('respuesta inválida: INVALIDA con el error, sin destino', () => {
    expect(decidirRespuestaOffline(paquete, 'demo-nodo-numero', 25)).toEqual({
      tipo: 'INVALIDA',
      error: {
        codigo: 'FUERA_DE_RANGO',
        mensaje: 'El valor ingresado está fuera del rango permitido.',
      },
    });
  });

  it.each([
    ['sin paquete', null, 'demo-nodo-escala', 3, 'SIN_PAQUETE'],
    ['nodo actual ausente', paquete, 'no-existe', 3, 'NODO_AUSENTE'],
    [
      'destino ausente del paquete',
      paquete,
      'demo-nodo-numero',
      16,
      'NODO_AUSENTE',
    ],
    [
      'validación no soportada',
      paquete,
      'demo-nodo-no-soportado',
      'hola',
      'REGLA_NO_SOPORTADA',
    ],
  ])('%s: BLOQUEO %s', (_caso, p, idNodo, valor, codigo) => {
    expect(decidirRespuestaOffline(p, idNodo, valor)).toMatchObject({
      tipo: 'BLOQUEO',
      codigo,
    });
  });
});
