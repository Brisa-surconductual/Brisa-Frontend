import { describe, expect, it } from 'vitest';

import { OPERADOR_CONDICION } from '../types/operadorCondicion.js';
import { TIPO_DATO_VALIDACION } from '../types/tipoDatoValidacion.js';
import {
  MODO_REGLA,
  opcionesFormatoTexto,
  opcionesNodo,
  opcionesReglaValidacion,
  payloadActualizarTransicion,
  payloadCrearTransicion,
  validarTransicion,
  valoresDesdeTransicion,
  VALORES_TRANSICION_VACIOS,
} from './transicionesAdmin.js';

const base = {
  ...VALORES_TRANSICION_VACIOS,
  idNodoOrigen: 'a',
  idNodoDestino: 'b',
  ordenEvaluacion: '1',
  modoRegla: MODO_REGLA.EXISTENTE,
  idReglaValidacion: 'r-1',
};

describe('validarTransicion', () => {
  it('exige origen, destino distinto, orden y una regla', () => {
    expect(validarTransicion(VALORES_TRANSICION_VACIOS)).toMatchObject({
      idNodoOrigen: expect.any(String),
      idNodoDestino: expect.any(String),
      ordenEvaluacion: expect.any(String),
      idReglaValidacion: expect.any(String),
    });
  });

  it('rechaza que el destino sea el mismo nodo de origen', () => {
    expect(validarTransicion({ ...base, idNodoDestino: 'a' })).toHaveProperty(
      'idNodoDestino',
    );
  });

  it('IGUALDAD exige un valor', () => {
    expect(
      validarTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.IGUALDAD,
        valorIgualdad: '',
      }),
    ).toHaveProperty('valorIgualdad');
    expect(
      validarTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.IGUALDAD,
        valorIgualdad: 'Sí',
      }),
    ).toEqual({});
  });

  it('RANGO exige al menos un límite y coherencia min/max', () => {
    expect(
      validarTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.RANGO,
        valorMin: '',
        valorMax: '',
      }),
    ).toHaveProperty('valorMin');
    expect(
      validarTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.RANGO,
        valorMin: '5',
        valorMax: '1',
      }),
    ).toHaveProperty('valorMax');
    expect(
      validarTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.RANGO,
        valorMin: '1',
        valorMax: '5',
      }),
    ).toEqual({});
  });

  it('CATEGORIA exige al menos un valor', () => {
    expect(
      validarTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.CATEGORIA,
        valorCategoria: '',
      }),
    ).toHaveProperty('valorCategoria');
  });

  it('el orden de evaluación debe ser entero desde 1', () => {
    for (const malo of ['0', '-1', '1.5', 'a', '']) {
      expect(
        validarTransicion({ ...base, ordenEvaluacion: malo }),
      ).toHaveProperty('ordenEvaluacion');
    }
  });

  it('regla nueva exige mensaje de error y, en SELECCION, opciones', () => {
    const nueva = {
      ...base,
      modoRegla: MODO_REGLA.NUEVA,
      reglaMensajeError: '',
    };
    expect(validarTransicion(nueva)).toHaveProperty('reglaMensajeError');

    expect(
      validarTransicion({
        ...nueva,
        reglaMensajeError: 'Error',
        reglaTipoDato: TIPO_DATO_VALIDACION.SELECCION,
        reglaValoresPermitidos: '',
      }),
    ).toHaveProperty('reglaValoresPermitidos');
  });
});

describe('payloadCrearTransicion', () => {
  it('construye valor_condicion para IGUALDAD y usa la regla existente', () => {
    expect(
      payloadCrearTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.IGUALDAD,
        valorIgualdad: 'Sí',
      }),
    ).toEqual({
      id_nodo_origen: 'a',
      id_nodo_destino: 'b',
      operador_condicion: OPERADOR_CONDICION.IGUALDAD,
      valor_condicion: { valor: 'Sí' },
      orden_evaluacion: 1,
      id_regla_validacion: 'r-1',
    });
  });

  it('construye valor_condicion para RANGO y CATEGORIA', () => {
    expect(
      payloadCrearTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.RANGO,
        valorMin: '1',
        valorMax: '5',
      }).valor_condicion,
    ).toEqual({ min: 1, max: 5 });

    expect(
      payloadCrearTransicion({
        ...base,
        operadorCondicion: OPERADOR_CONDICION.CATEGORIA,
        valorCategoria: 'a, b ,c',
      }).valor_condicion,
    ).toEqual({ valores: ['a', 'b', 'c'] });
  });

  it('resuelve el preset de formato de texto a su expresión regular', () => {
    const payload = payloadCrearTransicion({
      ...base,
      modoRegla: MODO_REGLA.NUEVA,
      reglaTipoDato: TIPO_DATO_VALIDACION.TEXTO,
      reglaMensajeError: 'Escribe solo letras.',
      reglaFormatoPreset: 'SOLO_LETRAS',
    });

    expect(payload.regla_validacion.formato_regex).toBe(
      '^[A-Za-zÁ-Úá-úÑñ\\s]+$',
    );
  });

  it('"Cualquier texto" no envía formato_regex', () => {
    const payload = payloadCrearTransicion({
      ...base,
      modoRegla: MODO_REGLA.NUEVA,
      reglaTipoDato: TIPO_DATO_VALIDACION.TEXTO,
      reglaMensajeError: 'Respuesta requerida',
      reglaFormatoPreset: 'CUALQUIERA',
    });

    expect(payload.regla_validacion).not.toHaveProperty('formato_regex');
  });

  it('envía regla_validacion embebida cuando el modo es nueva', () => {
    const payload = payloadCrearTransicion({
      ...base,
      modoRegla: MODO_REGLA.NUEVA,
      reglaTipoDato: TIPO_DATO_VALIDACION.NUMERICO,
      reglaObligatorio: false,
      reglaValorMin: '0',
      reglaValorMax: '10',
      reglaMensajeError: 'Fuera de rango',
    });

    expect(payload).not.toHaveProperty('id_regla_validacion');
    expect(payload.regla_validacion).toEqual({
      tipo_dato: TIPO_DATO_VALIDACION.NUMERICO,
      obligatorio: false,
      mensaje_error: 'Fuera de rango',
      valor_min: 0,
      valor_max: 10,
    });
  });
});

describe('payloadActualizarTransicion', () => {
  const transicion = {
    destinoId: 'b',
    operador: OPERADOR_CONDICION.IGUALDAD,
    valorCondicion: { valor: 'Sí' },
    ordenEvaluacion: 1,
    idReglaValidacion: 'r-1',
  };

  it('sin cambios devuelve null', () => {
    expect(
      payloadActualizarTransicion(transicion, {
        ...base,
        operadorCondicion: OPERADOR_CONDICION.IGUALDAD,
        valorIgualdad: 'Sí',
      }),
    ).toBeNull();
  });

  it('cambiar el destino viaja solo', () => {
    expect(
      payloadActualizarTransicion(transicion, {
        ...base,
        idNodoDestino: 'c',
        operadorCondicion: OPERADOR_CONDICION.IGUALDAD,
        valorIgualdad: 'Sí',
      }),
    ).toEqual({ id_nodo_destino: 'c' });
  });

  it('cambiar el valor de la condición viaja', () => {
    expect(
      payloadActualizarTransicion(transicion, {
        ...base,
        operadorCondicion: OPERADOR_CONDICION.IGUALDAD,
        valorIgualdad: 'No',
      }),
    ).toEqual({ valor_condicion: { valor: 'No' } });
  });

  it('cambiar a una regla nueva embebe su definición', () => {
    expect(
      payloadActualizarTransicion(transicion, {
        ...base,
        operadorCondicion: OPERADOR_CONDICION.IGUALDAD,
        valorIgualdad: 'Sí',
        modoRegla: MODO_REGLA.NUEVA,
        reglaMensajeError: 'Obligatorio',
      }),
    ).toEqual({
      regla_validacion: {
        tipo_dato: TIPO_DATO_VALIDACION.TEXTO,
        obligatorio: true,
        mensaje_error: 'Obligatorio',
      },
    });
  });
});

describe('valoresDesdeTransicion', () => {
  it('precarga según el operador y apunta a la regla actual', () => {
    expect(
      valoresDesdeTransicion({
        origenId: 'a',
        destinoId: 'b',
        operador: OPERADOR_CONDICION.RANGO,
        valorCondicion: { min: 1, max: 5 },
        ordenEvaluacion: 2,
        idReglaValidacion: 'r-9',
      }),
    ).toMatchObject({
      idNodoOrigen: 'a',
      idNodoDestino: 'b',
      operadorCondicion: OPERADOR_CONDICION.RANGO,
      valorMin: '1',
      valorMax: '5',
      ordenEvaluacion: '2',
      modoRegla: MODO_REGLA.EXISTENTE,
      idReglaValidacion: 'r-9',
    });
  });
});

describe('opcionesFormatoTexto', () => {
  it('ofrece presets por nombre, sin exponer la expresión regular', () => {
    const opciones = opcionesFormatoTexto();

    expect(opciones).toContainEqual({
      value: 'CUALQUIERA',
      label: 'Cualquier texto',
    });
    expect(opciones).toContainEqual({
      value: 'SOLO_LETRAS',
      label: 'Solo letras (sin números ni símbolos)',
    });
    for (const opcion of opciones) {
      expect(opcion.label.includes('^')).toBe(false);
      expect(opcion.label.includes('\\')).toBe(false);
    }
  });
});

describe('opcionesNodo y opcionesReglaValidacion', () => {
  it('convierte nodos en opciones por etiqueta', () => {
    expect(opcionesNodo([{ id: 'a', etiqueta: '1. Hola' }])).toEqual([
      { value: 'a', label: '1. Hola' },
    ]);
    expect(opcionesNodo(undefined)).toEqual([]);
  });

  it('convierte el catálogo de reglas en opciones legibles', () => {
    expect(
      opcionesReglaValidacion([
        {
          id_regla_validacion: 'r-1',
          tipo_dato: TIPO_DATO_VALIDACION.TEXTO,
          mensaje_error: 'Respuesta requerida',
        },
      ]),
    ).toEqual([{ value: 'r-1', label: 'Texto · Respuesta requerida' }]);
    expect(opcionesReglaValidacion(undefined)).toEqual([]);
  });
});
