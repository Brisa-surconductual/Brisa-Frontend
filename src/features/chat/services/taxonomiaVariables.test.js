import { describe, expect, it } from 'vitest';

import { TIPO_ENTRADA } from '../types/tipoEntrada.js';
import {
  VALORES_NODO_VACIOS,
  opcionesTipoEntrada,
  payloadActualizarNodo,
  payloadCrearNodo,
  valoresDesdeNodo,
} from './nodosAdmin.js';
import {
  VALORES_VARIABLE_VACIOS,
  ajustarNodoAVariable,
  describirEtiquetas,
  opcionesVariable,
  payloadCrearVariable,
  validarNodoContraVariable,
  validarVariable,
  valoresVariableCambiados,
} from './taxonomiaVariables.js';

// Seed 1.0 del backend (RF-30B).
const CRAVING = {
  codigo: 'NIVEL_CRAVING',
  nombre: 'Nivel de craving',
  tipo_valor: 'ENTERO',
  valores: null,
  tipos_entrada_permitidos: ['ESCALA', 'NUMERICO'],
  etiquetas: [
    { min: 0, max: 3, etiqueta: 'CRAVING_BAJO' },
    { min: 7, max: null, etiqueta: 'CRAVING_ALTO' },
  ],
  habilitada: true,
};
const EMOCION = {
  codigo: 'CONTEXTO_EMOCIONAL',
  nombre: 'Contexto emocional',
  tipo_valor: 'CATEGORIA',
  valores: ['ANSIEDAD', 'CALMA'],
  tipos_entrada_permitidos: ['OPCION_UNICA', 'MULTISELECCION'],
  etiquetas: {},
  habilitada: true,
};
const RIESGO = {
  codigo: 'SITUACION_RIESGO',
  nombre: 'Situación de riesgo',
  tipo_valor: 'BOOLEANO',
  valores: null,
  tipos_entrada_permitidos: ['BOOLEANO'],
  etiquetas: { true: 'RIESGO_PRESENTE', false: 'RIESGO_AUSENTE' },
  habilitada: false,
};

describe('RF-30B filtro del tipo de respuesta por variable', () => {
  const tipos = (variable) =>
    opcionesTipoEntrada(TIPO_ENTRADA.OPCION_UNICA, variable).map(
      (o) => o.value,
    );

  it('sin variable ofrece todos; con variable solo los admitidos', () => {
    expect(tipos(null)).toContain(TIPO_ENTRADA.BOOLEANO);
    expect(tipos(CRAVING)).toEqual([
      TIPO_ENTRADA.ESCALA,
      TIPO_ENTRADA.NUMERICO,
    ]);
    expect(tipos(EMOCION)).toEqual([
      TIPO_ENTRADA.OPCION_UNICA,
      TIPO_ENTRADA.MULTISELECCION,
    ]);
    expect(tipos(RIESGO)).toEqual([TIPO_ENTRADA.BOOLEANO]);
  });

  it('elegir la variable activa la respuesta y corrige un tipo no admitido', () => {
    const valores = ajustarNodoAVariable(
      { ...VALORES_NODO_VACIOS, variableCodigo: 'NIVEL_CRAVING' },
      CRAVING,
    );
    expect(valores.tieneEntrada).toBe(true);
    expect(valores.entradaTipo).toBe(TIPO_ENTRADA.ESCALA);
  });

  it('una variable de categorías precarga sus valores como opciones', () => {
    const valores = ajustarNodoAVariable(VALORES_NODO_VACIOS, EMOCION);
    expect(valores.entradaOpciones.map((o) => o.valor)).toEqual([
      'ANSIEDAD',
      'CALMA',
    ]);
  });

  it('valida variable deshabilitada, tipo incompatible y opciones ajenas', () => {
    const base = { ...VALORES_NODO_VACIOS, tieneEntrada: true };
    expect(
      validarNodoContraVariable({ ...base, variableCodigo: 'X' }, RIESGO),
    ).toHaveProperty('variableCodigo');
    expect(
      validarNodoContraVariable(
        { ...base, variableCodigo: 'NIVEL_CRAVING', entradaTipo: 'BOOLEANO' },
        CRAVING,
      ).variableCodigo,
    ).toMatch(/Escala numérica o Número/);
    expect(
      validarNodoContraVariable(
        {
          ...base,
          variableCodigo: 'CONTEXTO_EMOCIONAL',
          entradaOpciones: [{ valor: 'HAMBRE', etiqueta: '' }],
        },
        EMOCION,
      ).entradaOpciones,
    ).toMatch(/HAMBRE/);
    expect(validarNodoContraVariable(base, null)).toEqual({});
  });

  it('conserva como opción una variable deshabilitada ya asignada', () => {
    expect(opcionesVariable([CRAVING, RIESGO]).map((o) => o.value)).toEqual([
      'NIVEL_CRAVING',
    ]);
    expect(
      opcionesVariable([CRAVING, RIESGO], 'SITUACION_RIESGO').at(-1).label,
    ).toMatch(/deshabilitada/);
  });
});

describe('RF-30B contenido.variable en el payload del nodo', () => {
  const valores = {
    ...VALORES_NODO_VACIOS,
    idTipoNodo: 't',
    texto: '¿Cuánto craving sientes?',
    orden: '2',
    tieneEntrada: true,
    entradaTipo: TIPO_ENTRADA.ESCALA,
    entradaMin: '0',
    entradaMax: '10',
    variableCodigo: 'NIVEL_CRAVING',
  };

  it('crear envía contenido.variable', () => {
    expect(payloadCrearNodo(valores).contenido.variable).toEqual({
      codigo: 'NIVEL_CRAVING',
    });
  });

  it('el nodo final no lleva variable', () => {
    expect(
      payloadCrearNodo({ ...valores, esNodoFinal: true }).contenido,
    ).not.toHaveProperty('variable');
  });

  it('editar lee la variable y solo la envía si cambió o se quitó', () => {
    const nodo = {
      idTipoNodo: 't',
      texto: valores.texto,
      esNodoInicial: false,
      orden: 2,
      idContenido: null,
      entrada: { tipo: 'ESCALA', obligatorio: true, min: 0, max: 10 },
      contenido: {
        texto: valores.texto,
        entrada: { tipo: 'ESCALA', obligatorio: true, min: 0, max: 10 },
        variable: { codigo: 'NIVEL_CRAVING' },
      },
    };
    const iniciales = valoresDesdeNodo(nodo);
    expect(iniciales.variableCodigo).toBe('NIVEL_CRAVING');
    expect(payloadActualizarNodo(nodo, iniciales)).toBeNull();
    const sinVariable = payloadActualizarNodo(nodo, {
      ...iniciales,
      variableCodigo: '',
    });
    expect(sinVariable.contenido).not.toHaveProperty('variable');
  });
});

describe('RF-30B formulario de creación de variables', () => {
  it('cambiar el tipo reinicia las entradas admitidas y el código va en mayúsculas', () => {
    let v = valoresVariableCambiados(
      VALORES_VARIABLE_VACIOS,
      'tipoValor',
      'BOOLEANO',
    );
    expect(v.tiposEntrada).toEqual(['BOOLEANO']);
    v = valoresVariableCambiados(v, 'codigo', 'horas_sueno');
    expect(v.codigo).toBe('HORAS_SUENO');
  });

  it('valida código, rangos solapados y categorías', () => {
    const errores = validarVariable({
      ...VALORES_VARIABLE_VACIOS,
      codigo: 'x',
      rangos: [
        { min: '0', max: '5', etiqueta: 'A' },
        { min: '5', max: '', etiqueta: 'B' },
      ],
    });
    expect(errores).toHaveProperty('codigo');
    expect(errores).toHaveProperty('nombre');
    expect(errores.rangos).toMatch(/solaparse/);
    expect(
      validarVariable({
        ...VALORES_VARIABLE_VACIOS,
        codigo: 'LUGAR',
        nombre: 'Lugar',
        tipoValor: 'CATEGORIA',
        tiposEntrada: ['OPCION_UNICA'],
        categorias: [{ valor: 'A', etiqueta: '' }],
      }),
    ).toHaveProperty('categorias');
  });

  it('arma el payload del contrato para cada tipo', () => {
    const base = { ...VALORES_VARIABLE_VACIOS, codigo: 'X_Y', nombre: 'X' };
    expect(
      payloadCrearVariable({
        ...base,
        rangos: [{ min: '0', max: '', etiqueta: 'TODO' }],
      }),
    ).toEqual({
      codigo: 'X_Y',
      nombre: 'X',
      tipo_valor: 'ENTERO',
      tipos_entrada_permitidos: ['ESCALA', 'NUMERICO'],
      etiquetas: [{ min: 0, max: null, etiqueta: 'TODO' }],
    });
    expect(
      payloadCrearVariable({
        ...base,
        tipoValor: 'CATEGORIA',
        tiposEntrada: ['OPCION_UNICA'],
        categorias: [
          { valor: 'CASA', etiqueta: 'HOGAR' },
          { valor: 'U', etiqueta: '' },
        ],
      }),
    ).toMatchObject({ valores: ['CASA', 'U'], etiquetas: { CASA: 'HOGAR' } });
    expect(
      payloadCrearVariable({
        ...base,
        tipoValor: 'BOOLEANO',
        tiposEntrada: ['BOOLEANO'],
        etiquetaSi: 'SI',
        etiquetaNo: 'NO',
      }).etiquetas,
    ).toEqual({ true: 'SI', false: 'NO' });
  });

  it('describe las etiquetas de cada tipo', () => {
    expect(describirEtiquetas(CRAVING).map((r) => r.rango)).toEqual([
      '0 a 3',
      '7 o más',
    ]);
    expect(describirEtiquetas(RIESGO)[0]).toMatchObject({
      rango: 'Sí',
      etiqueta: 'RIESGO_PRESENTE',
    });
  });
});
