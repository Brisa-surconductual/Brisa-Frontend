import { describe, expect, it } from 'vitest';

import { OPERADOR_CONDICION } from '../types/operadorCondicion.js';
import {
  configuracionReglaTransicion,
  opcionesNodo,
  opcionesNodoOrigen,
  payloadActualizarTransicion,
  payloadCrearTransicion,
  validarTransicion,
  valoresDesdeTransicion,
  VALORES_TRANSICION_VACIOS,
} from './transicionesAdmin.js';

const opciones = [
  { valor: 'a', etiqueta: 'Opción A' },
  { valor: 'b', etiqueta: 'Opción B' },
  { valor: 'c', etiqueta: 'Opción C' },
];

const nodo = (entrada) => ({ id: 'a', etiqueta: '1. Pregunta', entrada });

const base = {
  ...VALORES_TRANSICION_VACIOS,
  idNodoOrigen: 'a',
  idNodoDestino: 'b',
  ordenEvaluacion: '1',
  mensajeError: 'Revisa tu respuesta.',
};

describe('configuracionReglaTransicion (RF-25)', () => {
  it('sin nodo origen no hay configuración', () => {
    expect(configuracionReglaTransicion(undefined)).toEqual({ tipo: null });
  });

  it('un nodo sin respuesta va sin regla (transición automática)', () => {
    expect(configuracionReglaTransicion(nodo(null))).toMatchObject({
      tipo: 'CONTINUAR',
      sinRegla: true,
    });
  });

  it.each(['TEXTO_LIBRE', 'FECHA_HORA'])(
    '%s no admite transiciones aquí',
    (tipo) => {
      expect(configuracionReglaTransicion(nodo({ tipo }))).toMatchObject({
        noSoportado: true,
      });
    },
  );

  it('selección única: igualdad fija, tags Texto/Cualquier texto y sus opciones', () => {
    expect(
      configuracionReglaTransicion(nodo({ tipo: 'SELECCION_UNICA', opciones })),
    ).toMatchObject({
      tipo: 'OPCION_UNICA',
      operadorFijo: OPERADOR_CONDICION.IGUALDAD,
      etiquetas: { tipoDato: 'Texto', formato: 'Cualquier texto' },
      opciones: [
        { value: 'a', label: 'Opción A' },
        { value: 'b', label: 'Opción B' },
        { value: 'c', label: 'Opción C' },
      ],
    });
  });

  it('selección múltiple: límites de selección del nodo (1..n por defecto)', () => {
    expect(
      configuracionReglaTransicion(
        nodo({ tipo: 'SELECCION_MULTIPLE', opciones, min_selecciones: 2 }),
      ),
    ).toMatchObject({
      tipo: 'MULTISELECCION',
      operadorFijo: OPERADOR_CONDICION.IGUALDAD,
      etiquetas: { tipoDato: 'Texto', formato: 'Cualquier texto' },
      minSelecciones: 2,
      maxSelecciones: 3,
    });
  });

  it('Sí/No: igualdad fija, tag Selección y opciones Sí/No', () => {
    expect(
      configuracionReglaTransicion(nodo({ tipo: 'BOOLEANO' })),
    ).toMatchObject({
      operadorFijo: OPERADOR_CONDICION.IGUALDAD,
      etiquetas: { tipoDato: 'Selección' },
      opciones: [
        { value: 'true', label: 'Sí' },
        { value: 'false', label: 'No' },
      ],
    });
  });

  it('escala: rango fijo con los límites del nodo', () => {
    expect(
      configuracionReglaTransicion(
        nodo({ tipo: 'ESCALA', min: 1, max: 5, paso: 1 }),
      ),
    ).toMatchObject({
      operadorFijo: OPERADOR_CONDICION.RANGO,
      etiquetas: { tipoDato: 'Numérico' },
      min: 1,
      max: 5,
    });
  });

  it('número: el admin elige operador y la igualdad lista los valores del nodo', () => {
    const config = configuracionReglaTransicion(
      nodo({ tipo: 'NUMERICO', min: 0, max: 10, paso: 5 }),
    );
    expect(config).toMatchObject({
      operadorFijo: null,
      operadores: [
        { value: OPERADOR_CONDICION.IGUALDAD, label: 'Igualdad' },
        { value: OPERADOR_CONDICION.RANGO, label: 'Rango' },
      ],
      valores: [
        { value: '0', label: '0' },
        { value: '5', label: '5' },
        { value: '10', label: '10' },
      ],
    });
  });

  it('número o escala sin mínimo y máximo en el nodo no se pueden configurar', () => {
    expect(
      configuracionReglaTransicion(nodo({ tipo: 'NUMERICO' })),
    ).toMatchObject({
      faltaRango: true,
    });
  });
});

describe('opcionesNodoOrigen', () => {
  it('no ofrece como origen nodos de texto libre ni fecha u hora', () => {
    expect(
      opcionesNodoOrigen([
        { id: 'a', etiqueta: 'A', entrada: { tipo: 'BOOLEANO' } },
        { id: 'b', etiqueta: 'B', entrada: { tipo: 'TEXTO_LIBRE' } },
        { id: 'c', etiqueta: 'C', entrada: { tipo: 'FECHA_HORA' } },
        { id: 'd', etiqueta: 'D', entrada: null },
      ]),
    ).toEqual([
      { value: 'a', label: 'A' },
      { value: 'd', label: 'D' },
    ]);
  });

  it('opcionesNodo sigue listando todos (destino)', () => {
    expect(opcionesNodo([{ id: 'a', etiqueta: '1. Hola' }])).toEqual([
      { value: 'a', label: '1. Hola' },
    ]);
    expect(opcionesNodo(undefined)).toEqual([]);
  });
});

describe('validarTransicion (RF-25)', () => {
  const unica = configuracionReglaTransicion(
    nodo({ tipo: 'SELECCION_UNICA', opciones }),
  );

  it('exige origen, destino distinto, orden, valor esperado y mensaje', () => {
    expect(validarTransicion(VALORES_TRANSICION_VACIOS, unica)).toMatchObject({
      idNodoOrigen: expect.any(String),
      idNodoDestino: expect.any(String),
      ordenEvaluacion: expect.any(String),
      valorUnico: expect.any(String),
      mensajeError: expect.any(String),
    });
    expect(
      validarTransicion({ ...base, idNodoDestino: 'a' }, unica),
    ).toHaveProperty('idNodoDestino');
  });

  it('selección única válida', () => {
    expect(validarTransicion({ ...base, valorUnico: 'a' }, unica)).toEqual({});
  });

  it('selección múltiple respeta los límites del nodo', () => {
    const multiple = configuracionReglaTransicion(
      nodo({
        tipo: 'SELECCION_MULTIPLE',
        opciones,
        min_selecciones: 2,
        max_selecciones: 2,
      }),
    );
    expect(
      validarTransicion({ ...base, valoresMultiples: ['a'] }, multiple),
    ).toHaveProperty('valoresMultiples');
    expect(
      validarTransicion({ ...base, valoresMultiples: ['a', 'b'] }, multiple),
    ).toEqual({});
  });

  it('rango dentro de los límites del nodo, con mínimo ≤ máximo', () => {
    const escala = configuracionReglaTransicion(
      nodo({ tipo: 'ESCALA', min: 1, max: 10 }),
    );
    expect(
      validarTransicion({ ...base, rangoMin: '0', rangoMax: '5' }, escala),
    ).toHaveProperty('rangoMin');
    expect(
      validarTransicion({ ...base, rangoMin: '6', rangoMax: '3' }, escala),
    ).toHaveProperty('rangoMax');
    expect(
      validarTransicion({ ...base, rangoMin: '3', rangoMax: '11' }, escala),
    ).toHaveProperty('rangoMax');
    expect(
      validarTransicion({ ...base, rangoMin: '3', rangoMax: '6' }, escala),
    ).toEqual({});
  });

  it('número exige elegir el operador', () => {
    const numero = configuracionReglaTransicion(
      nodo({ tipo: 'NUMERICO', min: 0, max: 5 }),
    );
    expect(validarTransicion({ ...base }, numero)).toHaveProperty('operador');
    expect(
      validarTransicion(
        { ...base, operador: OPERADOR_CONDICION.IGUALDAD, valorUnico: '3' },
        numero,
      ),
    ).toEqual({});
  });

  it('un nodo sin respuesta no pide regla', () => {
    const continuar = configuracionReglaTransicion(nodo(null));
    expect(validarTransicion({ ...base, mensajeError: '' }, continuar)).toEqual(
      {},
    );
  });

  it('origen de texto libre se rechaza en el formulario', () => {
    const texto = configuracionReglaTransicion(nodo({ tipo: 'TEXTO_LIBRE' }));
    expect(validarTransicion(base, texto)).toHaveProperty('idNodoOrigen');
  });
});

describe('payloadCrearTransicion (RF-25)', () => {
  const crear = (entrada, valores) =>
    payloadCrearTransicion(
      { ...base, ...valores },
      configuracionReglaTransicion(nodo(entrada)),
    );

  it('selección única envía la opción tal cual, sin operador', () => {
    expect(
      crear({ tipo: 'SELECCION_UNICA', opciones }, { valorUnico: 'b' }),
    ).toEqual({
      id_nodo_origen: 'a',
      id_nodo_destino: 'b',
      orden_evaluacion: 1,
      regla_validacion: {
        valor_esperado: { valor: 'b' },
        mensaje_error: 'Revisa tu respuesta.',
      },
    });
  });

  it('Sí/No envía un booleano real', () => {
    expect(
      crear({ tipo: 'BOOLEANO' }, { valorUnico: 'false' }).regla_validacion
        .valor_esperado,
    ).toEqual({ valor: false });
  });

  it('selección múltiple envía la lista', () => {
    expect(
      crear(
        { tipo: 'SELECCION_MULTIPLE', opciones },
        { valoresMultiples: ['a', 'c'] },
      ).regla_validacion.valor_esperado,
    ).toEqual({ valor: ['a', 'c'] });
  });

  it('escala envía el rango numérico', () => {
    expect(
      crear(
        { tipo: 'ESCALA', min: 1, max: 10 },
        { rangoMin: '2', rangoMax: '4' },
      ).regla_validacion.valor_esperado,
    ).toEqual({ min: 2, max: 4 });
  });

  it('número envía el operador elegido y un número real', () => {
    expect(
      crear(
        { tipo: 'NUMERICO', min: 0, max: 10 },
        { operador: OPERADOR_CONDICION.IGUALDAD, valorUnico: '7' },
      ).regla_validacion,
    ).toEqual({
      operador_condicion: OPERADOR_CONDICION.IGUALDAD,
      valor_esperado: { valor: 7 },
      mensaje_error: 'Revisa tu respuesta.',
    });
  });

  it('un nodo sin respuesta no envía regla', () => {
    expect(crear(null, {})).not.toHaveProperty('regla_validacion');
  });
});

describe('valoresDesdeTransicion y payloadActualizarTransicion', () => {
  const transicion = {
    origenId: 'a',
    destinoId: 'b',
    ordenEvaluacion: 1,
    regla: {
      operador: OPERADOR_CONDICION.IGUALDAD,
      valorEsperado: { valor: 'b' },
      mensajeError: 'Revisa tu respuesta.',
    },
  };
  const unica = configuracionReglaTransicion(
    nodo({ tipo: 'SELECCION_UNICA', opciones }),
  );

  it('precarga el valor esperado según su forma', () => {
    expect(valoresDesdeTransicion(transicion)).toMatchObject({
      idNodoOrigen: 'a',
      idNodoDestino: 'b',
      ordenEvaluacion: '1',
      operador: OPERADOR_CONDICION.IGUALDAD,
      valorUnico: 'b',
      mensajeError: 'Revisa tu respuesta.',
    });
    expect(
      valoresDesdeTransicion({
        ...transicion,
        regla: { ...transicion.regla, valorEsperado: { valor: ['a', 'c'] } },
      }).valoresMultiples,
    ).toEqual(['a', 'c']);
    expect(
      valoresDesdeTransicion({
        ...transicion,
        regla: {
          ...transicion.regla,
          operador: OPERADOR_CONDICION.RANGO,
          valorEsperado: { min: 2, max: 4 },
        },
      }),
    ).toMatchObject({ rangoMin: '2', rangoMax: '4' });
  });

  it('sin cambios devuelve null', () => {
    expect(
      payloadActualizarTransicion(
        transicion,
        valoresDesdeTransicion(transicion),
        unica,
      ),
    ).toBeNull();
  });

  it('solo viaja lo que cambió; la regla se reemplaza completa', () => {
    const valores = valoresDesdeTransicion(transicion);
    expect(
      payloadActualizarTransicion(
        transicion,
        { ...valores, idNodoDestino: 'c' },
        unica,
      ),
    ).toEqual({ id_nodo_destino: 'c' });
    expect(
      payloadActualizarTransicion(
        transicion,
        { ...valores, valorUnico: 'a' },
        unica,
      ),
    ).toEqual({
      regla_validacion: {
        valor_esperado: { valor: 'a' },
        mensaje_error: 'Revisa tu respuesta.',
      },
    });
  });
});
