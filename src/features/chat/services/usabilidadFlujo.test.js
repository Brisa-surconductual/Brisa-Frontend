import { describe, expect, it } from 'vitest';

import { DIMENSION_PERFIL_CLINICO } from '../types/dimensionPerfilClinico.js';
import { TIPO_ENTRADA } from '../types/tipoEntrada.js';
import {
  describirCondicionesCapturaPerfil,
  describirCondicionesGrafoInvalido,
  describirRegla,
  destinoImplicito,
  mapTransicion,
  salidasOrdenadasDeNodo,
} from './flujosAdmin.js';
import {
  payloadActualizarNodo,
  payloadCrearNodo,
  resumenCapturaPerfil,
  transicionesAfectadasPorCambio,
  validarNodo,
  VALORES_NODO_VACIOS,
  valoresDesdeNodo,
} from './nodosAdmin.js';
import {
  destinoPorDefectoActual,
  destinosOcupadosDelOrigen,
  opcionesNodoDestino,
  opcionesNodoOrigen,
  ordenEvaluacionSugerido,
  payloadActualizarTransicion,
  payloadCrearTransicion,
  validarTransicion,
  VALORES_TRANSICION_VACIOS,
  valoresDesdeTransicion,
} from './transicionesAdmin.js';

// RF-25 · Usabilidad del editor de flujos (PR 6).

const nodo = (id, extra = {}) => ({
  id,
  etiqueta: `${id}.`,
  esNodoInicial: false,
  esNodoFinal: false,
  orden: null,
  entrada: null,
  contenido: { texto: id },
  ...extra,
});

const siNo = {
  tipo: 'SELECCION_UNICA',
  opciones: [
    { valor: 'si', etiqueta: 'Sí, claro' },
    { valor: 'no', etiqueta: 'No' },
  ],
};

const transicion = (id, origenId, destinoId, orden, regla) => ({
  id,
  origenId,
  destinoId,
  ordenEvaluacion: orden,
  regla,
  esPorDefecto: regla?.operador === 'SIEMPRE',
});

const reglaIgual = (valor) => ({
  operador: 'IGUALDAD',
  valorEsperado: { valor },
  mensajeError: 'Elige',
});
const reglaSiempre = { operador: 'SIEMPRE', valorEsperado: {} };

describe('nodo final (CA-25-33, CA-25-34)', () => {
  it('viaja como es_nodo_final y sin respuesta ni captura', () => {
    const payload = payloadCrearNodo({
      ...VALORES_NODO_VACIOS,
      idTipoNodo: 't',
      texto: 'Fin',
      orden: '9',
      esNodoFinal: true,
      tieneEntrada: true,
      capturaPerfilDimension: DIMENSION_PERFIL_CLINICO.TIPO_CRAVING,
      capturaPerfilValor: 'POSITIVO',
    });

    expect(payload.es_nodo_final).toBe(true);
    expect(payload.contenido).toEqual({ texto: 'Fin' });
  });

  it('no puede ser también el nodo inicial', () => {
    expect(
      validarNodo({
        ...VALORES_NODO_VACIOS,
        idTipoNodo: 't',
        texto: 'x',
        orden: '1',
        esNodoInicial: true,
        esNodoFinal: true,
      }).esNodoFinal,
    ).toMatch(/inicial y el final/);
  });

  it('al editar solo envía el cambio de la marca final', () => {
    const existente = nodo('n', { idTipoNodo: 't', texto: 'n', orden: 2 });
    const valores = { ...valoresDesdeNodo(existente), esNodoFinal: true };

    expect(payloadActualizarNodo(existente, valores)).toEqual({
      es_nodo_final: true,
    });
  });
});

describe('captura de perfil con valor (CA-25-35)', () => {
  it('exige activar un valor cuando hay dimensión', () => {
    expect(
      validarNodo({
        ...VALORES_NODO_VACIOS,
        idTipoNodo: 't',
        texto: 'x',
        orden: '2',
        capturaPerfilDimension: DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA,
      }).capturaPerfilValor,
    ).toBeTruthy();
  });

  it('guarda dimensión y valor, y los resume en la tarjeta', () => {
    const payload = payloadCrearNodo({
      ...VALORES_NODO_VACIOS,
      idTipoNodo: 't',
      texto: 'x',
      orden: '2',
      capturaPerfilDimension: DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA,
      capturaPerfilValor: 'ABSTINENCIA_FISICA',
    });

    expect(payload.contenido.capturaPerfil).toEqual({
      dimension: 'TIPO_DEPENDENCIA',
      valor: 'ABSTINENCIA_FISICA',
    });
    expect(resumenCapturaPerfil(payload.contenido)).toBe(
      'Tipo de dependencia · Abstinencia física',
    );
  });
});

describe('transiciones afectadas por cambio de tipo (CA-25-36)', () => {
  const pregunta = nodo('a', { entrada: siNo, idTipoNodo: 't', texto: 'a' });
  const transiciones = [
    transicion('t1', 'a', 'b', 1, reglaIgual('si')),
    transicion('t2', 'b', 'c', 1, null),
  ];

  it('lista las salidas del nodo si cambia el tipo de respuesta', () => {
    const valores = {
      ...valoresDesdeNodo(pregunta),
      entradaTipo: TIPO_ENTRADA.ESCALA,
    };

    expect(
      transicionesAfectadasPorCambio(pregunta, valores, transiciones).map(
        (t) => t.id,
      ),
    ).toEqual(['t1']);
  });

  it('no afecta nada si el tipo no cambia', () => {
    expect(
      transicionesAfectadasPorCambio(
        pregunta,
        { ...valoresDesdeNodo(pregunta), texto: 'otro' },
        transiciones,
      ),
    ).toEqual([]);
  });
});

describe('formulario de transición (CA-25-37 a CA-25-40)', () => {
  const nodos = [
    nodo('a', { esNodoInicial: true }),
    nodo('b'),
    nodo('f', { esNodoFinal: true }),
  ];
  const transiciones = [
    transicion('t1', 'a', 'b', 1, reglaIgual('si')),
    transicion('t2', 'a', 'f', 2, reglaSiempre),
  ];

  it('el destino no ofrece el origen ni el nodo inicial', () => {
    expect(opcionesNodoDestino(nodos, 'b').map((o) => o.value)).toEqual(['f']);
  });

  it('el origen no ofrece el nodo final', () => {
    expect(opcionesNodoOrigen(nodos).map((o) => o.value)).toEqual(['a', 'b']);
  });

  it('sugiere el orden siguiente sin contar "cualquier otra respuesta"', () => {
    expect(ordenEvaluacionSugerido(transiciones, 'a')).toBe('2');
    expect(ordenEvaluacionSugerido(transiciones, 'b')).toBe('1');
    expect(destinoPorDefectoActual(transiciones, 'a')).toBe('f');
  });

  it('envía el destino de "cualquier otra respuesta" al crear', () => {
    const payload = payloadCrearTransicion(
      {
        ...VALORES_TRANSICION_VACIOS,
        idNodoOrigen: 'a',
        idNodoDestino: 'b',
        ordenEvaluacion: '1',
        valorUnico: 'si',
        mensajeError: 'Elige',
        idNodoDestinoOtro: 'f',
      },
      { tipo: TIPO_ENTRADA.OPCION_UNICA, operadorFijo: 'IGUALDAD' },
    );

    expect(payload.id_nodo_destino_otro).toBe('f');
  });

  it('la transición por defecto solo edita su destino', () => {
    const porDefecto = mapTransicion({
      id_regla: 't2',
      id_nodo_origen: 'a',
      id_nodo_destino: 'f',
      orden_evaluacion: 2,
      regla_validacion: {
        id_regla_validacion: 'r',
        operador_condicion: 'SIEMPRE',
        valor_esperado: {},
        mensaje_error: 'x',
      },
    });
    const valores = {
      ...valoresDesdeTransicion(porDefecto),
      idNodoDestino: 'b',
    };

    expect(porDefecto.esPorDefecto).toBe(true);
    expect(
      validarTransicion(valores, { tipo: TIPO_ENTRADA.OPCION_UNICA }),
    ).toEqual({});
    expect(payloadActualizarTransicion(porDefecto, valores, {})).toEqual({
      id_nodo_destino: 'b',
    });
  });
});

describe('orden de evaluación en la tarjeta del nodo (CA-25-41)', () => {
  it('lista las salidas en orden con la regla legible y "por defecto" al final', () => {
    const a = nodo('a', { esNodoInicial: true, entrada: siNo, orden: 1 });
    const nodos = [
      a,
      nodo('b', { orden: 2 }),
      nodo('f', { orden: 3, esNodoFinal: true }),
    ];
    const salidas = salidasOrdenadasDeNodo(a, nodos, [
      transicion('t2', 'a', 'f', 2, reglaSiempre),
      transicion('t1', 'a', 'b', 1, reglaIgual('si')),
    ]);

    expect(salidas.map((s) => [s.orden, s.regla, s.destino])).toEqual([
      [1, 'Si responde «Sí, claro»', 'b.'],
      [2, 'Cualquier otra respuesta', 'f.'],
    ]);
    expect(salidas[1].esPorDefecto).toBe(true);
  });

  it('describe rangos', () => {
    expect(
      describirRegla({
        regla: { operador: 'RANGO', valorEsperado: { min: 1, max: 3 } },
      }),
    ).toBe('Si responde entre 1 y 3');
  });
});

describe('avance implícito (CA-25-42)', () => {
  const nodos = [
    nodo('a', { esNodoInicial: true, orden: 1 }),
    nodo('b', { orden: 2 }),
    nodo('f', { orden: 3, esNodoFinal: true }),
  ];

  it('un nodo sin respuesta y sin transiciones avanza al siguiente por orden', () => {
    expect(destinoImplicito(nodos[0], nodos, [])?.id).toBe('b');
    expect(salidasOrdenadasDeNodo(nodos[1], nodos, [])[0]).toMatchObject({
      esImplicita: true,
      destinoId: 'f',
    });
  });

  it('no aplica sin nodo final, desde el final ni si hay transiciones', () => {
    const sinFinal = nodos.map((n) => ({ ...n, esNodoFinal: false }));
    expect(destinoImplicito(sinFinal[0], sinFinal, [])).toBeNull();
    expect(destinoImplicito(nodos[2], nodos, [])).toBeNull();
    expect(
      destinoImplicito(nodos[0], nodos, [transicion('t', 'a', 'f', 1, null)]),
    ).toBeNull();
  });
});

describe('condiciones de publicación (CA-25-43)', () => {
  it('explica la falta de nodo final y los nodos sin salida', () => {
    const condiciones = describirCondicionesGrafoInvalido({
      sin_nodo_final: true,
      nodos_sin_salida: [{ id_nodo: 'x', orden: 4, texto: 'Pregunta' }],
    });

    expect(condiciones[0]).toMatch(/Falta el nodo final/);
    expect(condiciones[1]).toMatch(/nodo sin salida.*orden 4/);
  });

  it('explica los valores de perfil clínico sin nodo de captura', () => {
    expect(
      describirCondicionesCapturaPerfil({
        dimensiones_valores_faltantes: [
          { dimension: 'TIPO_CRAVING', valores_faltantes: ['NEGATIVO'] },
        ],
      }),
    ).toEqual(['Falta un nodo que capture Tipo de craving: Negativo.']);
  });
});

describe('"cualquier otra respuesta" con destino distinto (RF-25)', () => {
  const base = {
    ...VALORES_TRANSICION_VACIOS,
    idNodoOrigen: 'a',
    idNodoDestino: 'b',
    ordenEvaluacion: '1',
    valorUnico: 'si',
    mensajeError: 'Elige',
  };
  const config = { tipo: TIPO_ENTRADA.OPCION_UNICA, operadorFijo: 'IGUALDAD' };

  it('rechaza el mismo destino para la transición y para cualquier otra respuesta', () => {
    expect(
      validarTransicion({ ...base, idNodoDestinoOtro: 'b' }, config)
        .idNodoDestinoOtro,
    ).toMatch(/destino distinto/);
  });

  it('al editar, rechaza el destino que ya usa cualquier otra respuesta', () => {
    expect(
      validarTransicion(base, config, {
        destinoPorDefecto: 'b',
        destinosEspecificos: [],
      }).idNodoDestino,
    ).toMatch(/mismo destino/);
  });

  it('cualquier otra respuesta no puede ir a un destino ya usado', () => {
    const ocupados = destinosOcupadosDelOrigen(
      [
        { id: 't1', origenId: 'a', destinoId: 'b', esPorDefecto: false },
        { id: 't2', origenId: 'a', destinoId: 'c', esPorDefecto: true },
      ],
      'a',
      't2',
    );
    expect(
      validarTransicion(
        { ...base, esPorDefecto: true, idNodoDestino: 'b' },
        config,
        ocupados,
      ).idNodoDestino,
    ).toMatch(/destino distinto/);
  });
});
