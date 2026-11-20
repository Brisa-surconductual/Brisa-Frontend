import { describe, expect, it } from 'vitest';

import {
  nombreContenidoCronograma,
  opcionesContenidoCronograma,
  opcionesDimensionPerfilClinico,
  opcionesTipoEntrada,
  opcionesTipoNodo,
  payloadActualizarNodo,
  payloadCrearNodo,
  resumenEntradaNodo,
  validarNodo,
  valoresDesdeNodo,
  VALORES_NODO_VACIOS,
} from './nodosAdmin.js';
import { TIPO_ENTRADA } from '../types/tipoEntrada.js';
import { DIMENSION_PERFIL_CLINICO } from '../types/dimensionPerfilClinico.js';

const nodo = {
  id: 'n-1',
  idTipoNodo: 't-1',
  tipoNodo: 'MENSAJE',
  texto: 'Hola',
  contenido: { texto: 'Hola', otra: 'clave' },
  esNodoInicial: true,
  orden: 2,
  idContenidoCronograma: null,
};

const catalogoContenidos = [
  {
    id_contenido_cronograma: 'cc-1',
    id_contenido: 'c-1',
    nombre_contenido: 'Video 1',
    id_unidad_temporal: 'ut-1',
    nombre_unidad: 'Semana 1',
    orden_unidad: 1,
  },
];

describe('validarNodo', () => {
  it('exige tipo, texto y orden al crear', () => {
    expect(validarNodo(VALORES_NODO_VACIOS)).toEqual({
      idTipoNodo: 'Elige el tipo de nodo.',
      texto: 'Escribe el texto del nodo.',
      orden: 'Indica el orden del nodo dentro del flujo.',
    });
  });

  it('un texto de solo espacios no es válido', () => {
    expect(
      validarNodo(
        { ...VALORES_NODO_VACIOS, idTipoNodo: 't', texto: '   ' },
        { esEdicion: true },
      ),
    ).toHaveProperty('texto');
  });

  it('el orden es obligatorio al crear, entero y desde 1', () => {
    const base = { ...VALORES_NODO_VACIOS, idTipoNodo: 't', texto: 'x' };

    expect(validarNodo({ ...base, orden: '' })).toHaveProperty('orden');
    expect(validarNodo({ ...base, orden: '3' })).toEqual({});
    for (const malo of ['0', '-1', '1.5', 'a']) {
      expect(validarNodo({ ...base, orden: malo })).toHaveProperty('orden');
    }
  });

  it('el orden es opcional al editar', () => {
    const base = { ...VALORES_NODO_VACIOS, idTipoNodo: 't', texto: 'x' };

    expect(validarNodo({ ...base, orden: '' }, { esEdicion: true })).toEqual(
      {},
    );
    expect(validarNodo({ ...base, orden: '3' }, { esEdicion: true })).toEqual(
      {},
    );
    expect(
      validarNodo({ ...base, orden: 'a' }, { esEdicion: true }),
    ).toHaveProperty('orden');
  });
});

describe('payloads', () => {
  it('crear: contenido solo con texto y orden solo si se escribió', () => {
    const valores = {
      idTipoNodo: 't-1',
      texto: 'Hola',
      esNodoInicial: false,
      orden: '',
    };

    expect(payloadCrearNodo(valores)).toEqual({
      id_tipo_nodo: 't-1',
      contenido: { texto: 'Hola' },
      es_nodo_inicial: false,
    });
    expect(payloadCrearNodo({ ...valores, orden: '4' }).orden).toBe(4);
  });

  it('editar: solo viajan los campos que cambiaron', () => {
    const valores = { ...valoresDesdeNodo(nodo), esNodoInicial: false };

    expect(payloadActualizarNodo(nodo, valores)).toEqual({
      es_nodo_inicial: false,
    });
  });

  it('editar el texto conserva las demás claves de contenido', () => {
    const valores = { ...valoresDesdeNodo(nodo), texto: 'Nuevo' };

    expect(payloadActualizarNodo(nodo, valores)).toEqual({
      contenido: { texto: 'Nuevo', otra: 'clave' },
    });
  });

  it('borrar el orden envía null y sin cambios devuelve null', () => {
    expect(
      payloadActualizarNodo(nodo, { ...valoresDesdeNodo(nodo), orden: '' }),
    ).toEqual({
      orden: null,
    });
    expect(payloadActualizarNodo(nodo, valoresDesdeNodo(nodo))).toBeNull();
  });

  it('crear: envía id_contenido_cronograma solo si se eligió', () => {
    const valores = {
      idTipoNodo: 't-1',
      texto: 'Hola',
      esNodoInicial: false,
      orden: '',
      idContenidoCronograma: '',
    };

    expect(payloadCrearNodo(valores)).not.toHaveProperty(
      'id_contenido_cronograma',
    );
    expect(
      payloadCrearNodo({ ...valores, idContenidoCronograma: 'cc-1' })
        .id_contenido_cronograma,
    ).toBe('cc-1');
  });

  it('editar: elegir un contenido asociado nuevo envía el cambio', () => {
    const valores = {
      ...valoresDesdeNodo(nodo),
      idContenidoCronograma: 'cc-1',
    };

    expect(payloadActualizarNodo(nodo, valores)).toEqual({
      id_contenido_cronograma: 'cc-1',
    });
  });

  it('editar: limpiar el contenido asociado envía null', () => {
    const conContenido = { ...nodo, idContenidoCronograma: 'cc-1' };
    const valores = {
      ...valoresDesdeNodo(conContenido),
      idContenidoCronograma: '',
    };

    expect(payloadActualizarNodo(conContenido, valores)).toEqual({
      id_contenido_cronograma: null,
    });
  });
});

describe('respuesta del nodo (PR4)', () => {
  const base = {
    idTipoNodo: 't-1',
    texto: 'Hola',
    esNodoInicial: false,
    orden: '2',
    tieneEntrada: true,
    entradaObligatorio: true,
  };

  it('sin "tieneEntrada" el nodo queda informativo, sin entrada', () => {
    const payload = payloadCrearNodo({ ...base, tieneEntrada: false });

    expect(payload.contenido).toEqual({ texto: 'Hola' });
  });

  it('exige al menos dos opciones para OPCION_UNICA/MULTISELECCION', () => {
    const valores = {
      ...VALORES_NODO_VACIOS,
      idTipoNodo: 't',
      texto: 'x',
      orden: '1',
      tieneEntrada: true,
      entradaTipo: TIPO_ENTRADA.OPCION_UNICA,
      entradaOpciones: [{ valor: 'si', etiqueta: '' }],
    };

    expect(validarNodo(valores)).toHaveProperty('entradaOpciones');
  });

  it('OPCION_UNICA: construye las opciones desde las filas del editor', () => {
    const payload = payloadCrearNodo({
      ...base,
      entradaTipo: TIPO_ENTRADA.OPCION_UNICA,
      entradaOpciones: [
        { valor: 'si', etiqueta: 'Sí' },
        { valor: 'no', etiqueta: '' },
      ],
      entradaObligatorio: true,
      entradaMinSelecciones: '',
      entradaMaxSelecciones: '',
    });

    expect(payload.contenido.entrada).toEqual({
      tipo: 'SELECCION_UNICA',
      obligatorio: true,
      opciones: [
        { valor: 'si', etiqueta: 'Sí' },
        { valor: 'no', etiqueta: 'no' },
      ],
    });
  });

  it('descarta las filas de opciones sin valor', () => {
    const payload = payloadCrearNodo({
      ...base,
      entradaTipo: TIPO_ENTRADA.OPCION_UNICA,
      entradaOpciones: [
        { valor: 'si', etiqueta: '' },
        { valor: '  ', etiqueta: '' },
        { valor: 'no', etiqueta: '' },
      ],
    });

    expect(payload.contenido.entrada.opciones).toEqual([
      { valor: 'si', etiqueta: 'si' },
      { valor: 'no', etiqueta: 'no' },
    ]);
  });

  it('MULTISELECCION: guarda tipo de configuración y límites de selección', () => {
    const payload = payloadCrearNodo({
      ...base,
      entradaTipo: TIPO_ENTRADA.MULTISELECCION,
      entradaOpciones: [
        { valor: 'a', etiqueta: '' },
        { valor: 'b', etiqueta: '' },
        { valor: 'c', etiqueta: '' },
      ],
      entradaMinSelecciones: '1',
      entradaMaxSelecciones: '2',
    });

    expect(payload.contenido.entrada).toMatchObject({
      tipo: 'SELECCION_MULTIPLE',
      min_selecciones: 1,
      max_selecciones: 2,
    });
  });

  it('rechaza un rango de selecciones invertido', () => {
    const valores = {
      ...VALORES_NODO_VACIOS,
      idTipoNodo: 't',
      texto: 'x',
      orden: '1',
      tieneEntrada: true,
      entradaTipo: TIPO_ENTRADA.MULTISELECCION,
      entradaOpciones: [
        { valor: 'a', etiqueta: '' },
        { valor: 'b', etiqueta: '' },
      ],
      entradaMinSelecciones: '3',
      entradaMaxSelecciones: '1',
    };

    expect(validarNodo(valores)).toHaveProperty('entradaMaxSelecciones');
  });

  it('ESCALA: guarda min, max, paso y etiquetas', () => {
    const payload = payloadCrearNodo({
      ...base,
      entradaTipo: TIPO_ENTRADA.ESCALA,
      entradaMin: '0',
      entradaMax: '10',
      entradaPaso: '1',
      entradaEtiquetaMin: 'Nada',
      entradaEtiquetaMax: 'Mucho',
    });

    expect(payload.contenido.entrada).toEqual({
      tipo: TIPO_ENTRADA.ESCALA,
      obligatorio: true,
      min: 0,
      max: 10,
      paso: 1,
      etiquetas: { min: 'Nada', max: 'Mucho' },
    });
  });

  it('NUMERICO: no admite paso ni etiquetas', () => {
    const payload = payloadCrearNodo({
      ...base,
      entradaTipo: TIPO_ENTRADA.NUMERICO,
      entradaMin: '0',
      entradaMax: '100',
      entradaPaso: '5',
    });

    expect(payload.contenido.entrada).toEqual({
      tipo: TIPO_ENTRADA.NUMERICO,
      obligatorio: true,
      min: 0,
      max: 100,
    });
  });

  it('rechaza un rango numérico invertido', () => {
    const valores = {
      ...VALORES_NODO_VACIOS,
      idTipoNodo: 't',
      texto: 'x',
      orden: '1',
      tieneEntrada: true,
      entradaTipo: TIPO_ENTRADA.NUMERICO,
      entradaMin: '10',
      entradaMax: '1',
    };

    expect(validarNodo(valores)).toHaveProperty('entradaMax');
  });

  it('TEXTO_LIBRE: guarda límites de palabras y caracteres', () => {
    const payload = payloadCrearNodo({
      ...base,
      entradaTipo: TIPO_ENTRADA.TEXTO_LIBRE,
      entradaMinPalabras: '1',
      entradaMaxPalabras: '50',
      entradaMaxCaracteres: '280',
    });

    expect(payload.contenido.entrada).toEqual({
      tipo: TIPO_ENTRADA.TEXTO_LIBRE,
      obligatorio: true,
      min_palabras: 1,
      max_palabras: 50,
      max_caracteres: 280,
    });
  });

  it('FECHA_HORA: guarda el formato y los límites como texto', () => {
    const payload = payloadCrearNodo({
      ...base,
      entradaTipo: TIPO_ENTRADA.FECHA_HORA,
      entradaFormato: 'FECHA',
      entradaMin: '2026-01-01',
      entradaMax: '2026-12-31',
    });

    expect(payload.contenido.entrada).toEqual({
      tipo: TIPO_ENTRADA.FECHA_HORA,
      obligatorio: true,
      formato: 'FECHA',
      min: '2026-01-01',
      max: '2026-12-31',
    });
  });

  it('BOOLEANO: no agrega subcampos', () => {
    const payload = payloadCrearNodo({
      ...base,
      entradaTipo: TIPO_ENTRADA.BOOLEANO,
    });

    expect(payload.contenido.entrada).toEqual({
      tipo: TIPO_ENTRADA.BOOLEANO,
      obligatorio: true,
    });
  });

  it('editar: precarga la entrada existente y detecta si cambió', () => {
    const nodoConEntrada = {
      idTipoNodo: 't-1',
      texto: 'Hola',
      contenido: { texto: 'Hola' },
      esNodoInicial: false,
      orden: 1,
      idContenidoCronograma: null,
      entrada: {
        tipo: 'SELECCION_UNICA',
        obligatorio: true,
        opciones: [{ valor: 'si', etiqueta: 'Sí' }],
      },
    };

    const valores = valoresDesdeNodo(nodoConEntrada);
    expect(valores).toMatchObject({
      tieneEntrada: true,
      entradaTipo: TIPO_ENTRADA.OPCION_UNICA,
      entradaOpciones: [{ valor: 'si', etiqueta: 'Sí' }],
    });

    // Sin cambios: no viaja `contenido`.
    expect(payloadActualizarNodo(nodoConEntrada, valores)).toBeNull();

    // Desactivar la entrada sí viaja como cambio.
    const sinEntrada = { ...valores, tieneEntrada: false };
    expect(payloadActualizarNodo(nodoConEntrada, sinEntrada)).toEqual({
      contenido: { texto: 'Hola' },
    });
  });
});

describe('resumenEntradaNodo', () => {
  it('describe el tipo de respuesta configurado', () => {
    expect(
      resumenEntradaNodo({ tipo: 'SELECCION_UNICA', obligatorio: true }),
    ).toBe('Selección única');
    expect(
      resumenEntradaNodo({ tipo: 'TEXTO_LIBRE', obligatorio: false }),
    ).toBe('Texto libre (opcional)');
    expect(resumenEntradaNodo(null)).toBe('');
  });
});

describe('opcionesTipoEntrada (RF-25, árboles grupales)', () => {
  it('no ofrece CONTINUAR, texto libre ni fecha u hora', () => {
    const valores = opcionesTipoEntrada().map((o) => o.value);

    expect(valores).toEqual([
      TIPO_ENTRADA.OPCION_UNICA,
      TIPO_ENTRADA.MULTISELECCION,
      TIPO_ENTRADA.ESCALA,
      TIPO_ENTRADA.NUMERICO,
      TIPO_ENTRADA.BOOLEANO,
    ]);
  });

  it('al editar un nodo antiguo de un tipo oculto, conserva ese tipo como opción', () => {
    expect(
      opcionesTipoEntrada(TIPO_ENTRADA.TEXTO_LIBRE).map((o) => o.value),
    ).toContain(TIPO_ENTRADA.TEXTO_LIBRE);
  });

  it('un nodo nuevo arranca en selección única', () => {
    expect(VALORES_NODO_VACIOS.entradaTipo).toBe(TIPO_ENTRADA.OPCION_UNICA);
  });
});

describe('límites que necesitan las reglas de sus transiciones (RF-25)', () => {
  const valores = {
    ...VALORES_NODO_VACIOS,
    idTipoNodo: 't',
    texto: 'x',
    orden: '1',
    tieneEntrada: true,
  };

  it.each([TIPO_ENTRADA.NUMERICO, TIPO_ENTRADA.ESCALA])(
    '%s exige mínimo y máximo, con mínimo menor que máximo',
    (entradaTipo) => {
      expect(validarNodo({ ...valores, entradaTipo })).toMatchObject({
        entradaMin: expect.any(String),
        entradaMax: expect.any(String),
      });
      expect(
        validarNodo({
          ...valores,
          entradaTipo,
          entradaMin: '5',
          entradaMax: '5',
        }),
      ).toHaveProperty('entradaMax');
      expect(
        validarNodo({
          ...valores,
          entradaTipo,
          entradaMin: '1',
          entradaMax: '5',
        }),
      ).toEqual({});
    },
  );

  it('selección múltiple: límites de selección entre 1 y la cantidad de opciones', () => {
    const multiple = {
      ...valores,
      entradaTipo: TIPO_ENTRADA.MULTISELECCION,
      entradaOpciones: [
        { valor: 'a', etiqueta: '' },
        { valor: 'b', etiqueta: '' },
      ],
    };
    expect(
      validarNodo({ ...multiple, entradaMinSelecciones: '0' }),
    ).toHaveProperty('entradaMinSelecciones');
    expect(
      validarNodo({ ...multiple, entradaMaxSelecciones: '3' }),
    ).toHaveProperty('entradaMaxSelecciones');
    expect(
      validarNodo({
        ...multiple,
        entradaMinSelecciones: '1',
        entradaMaxSelecciones: '2',
      }),
    ).toEqual({});
  });
});

describe('opcionesTipoNodo', () => {
  it('convierte el catálogo en opciones', () => {
    expect(
      opcionesTipoNodo([{ id_tipo_nodo: 'a', nombre: 'MENSAJE' }]),
    ).toEqual([{ value: 'a', label: 'MENSAJE' }]);
    expect(opcionesTipoNodo(undefined)).toEqual([]);
  });
});

describe('opcionesContenidoCronograma', () => {
  it('convierte el catálogo en opciones con contenido y unidad', () => {
    expect(opcionesContenidoCronograma(catalogoContenidos)).toEqual([
      { value: 'cc-1', label: 'Video 1 · Semana 1' },
    ]);
    expect(opcionesContenidoCronograma(undefined)).toEqual([]);
  });
});

describe('nombreContenidoCronograma', () => {
  it('resuelve el nombre y la unidad de un contenido asociado', () => {
    expect(nombreContenidoCronograma(catalogoContenidos, 'cc-1')).toBe(
      'Video 1 · Semana 1',
    );
  });

  it('devuelve vacío sin id o sin coincidencia en el catálogo', () => {
    expect(nombreContenidoCronograma(catalogoContenidos, null)).toBe('');
    expect(nombreContenidoCronograma(catalogoContenidos, 'cc-x')).toBe('');
    expect(nombreContenidoCronograma(undefined, 'cc-1')).toBe('');
  });
});

describe('captura de perfil clínico (RF-25 / RF-27B)', () => {
  it('opcionesDimensionPerfilClinico ofrece las dos dimensiones', () => {
    expect(opcionesDimensionPerfilClinico()).toEqual([
      { value: 'TIPO_DEPENDENCIA', label: 'Tipo de dependencia' },
      { value: 'TIPO_CRAVING', label: 'Tipo de craving' },
    ]);
  });

  it('valoresDesdeNodo lee capturaPerfil.dimension del contenido', () => {
    const conCaptura = {
      ...nodo,
      contenido: {
        ...nodo.contenido,
        capturaPerfil: { dimension: DIMENSION_PERFIL_CLINICO.TIPO_CRAVING },
      },
    };

    expect(valoresDesdeNodo(conCaptura).capturaPerfilDimension).toBe(
      DIMENSION_PERFIL_CLINICO.TIPO_CRAVING,
    );
  });

  it('valoresDesdeNodo reconoce el alias legado captura_perfil', () => {
    const conAlias = {
      ...nodo,
      contenido: { ...nodo.contenido, captura_perfil: 'tipo_dependencia' },
    };

    expect(valoresDesdeNodo(conAlias).capturaPerfilDimension).toBe(
      DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA,
    );
  });

  it('valoresDesdeNodo devuelve vacío cuando el nodo no captura perfil', () => {
    expect(valoresDesdeNodo(nodo).capturaPerfilDimension).toBe('');
  });

  it('crear: agrega capturaPerfil solo si se eligió una dimensión', () => {
    const valores = {
      idTipoNodo: 't-1',
      texto: 'Hola',
      esNodoInicial: false,
      orden: '',
      capturaPerfilDimension: '',
    };

    expect(payloadCrearNodo(valores)).toEqual({
      id_tipo_nodo: 't-1',
      contenido: { texto: 'Hola' },
      es_nodo_inicial: false,
    });
    expect(
      payloadCrearNodo({
        ...valores,
        capturaPerfilDimension: DIMENSION_PERFIL_CLINICO.TIPO_CRAVING,
      }).contenido,
    ).toEqual({
      texto: 'Hola',
      capturaPerfil: { dimension: DIMENSION_PERFIL_CLINICO.TIPO_CRAVING },
    });
  });

  it('editar: marcar un nodo con una dimensión nueva envía el cambio', () => {
    const valores = {
      ...valoresDesdeNodo(nodo),
      capturaPerfilDimension: DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA,
    };

    expect(payloadActualizarNodo(nodo, valores)).toEqual({
      contenido: {
        texto: 'Hola',
        otra: 'clave',
        capturaPerfil: { dimension: DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA },
      },
    });
  });

  it('editar: quitar la marca de captura envía el contenido sin ella', () => {
    const conCaptura = {
      ...nodo,
      contenido: {
        ...nodo.contenido,
        capturaPerfil: { dimension: DIMENSION_PERFIL_CLINICO.TIPO_CRAVING },
      },
    };
    const valores = {
      ...valoresDesdeNodo(conCaptura),
      capturaPerfilDimension: '',
    };

    expect(payloadActualizarNodo(conCaptura, valores)).toEqual({
      contenido: { texto: 'Hola', otra: 'clave' },
    });
  });

  it('editar: no tocar la dimensión no genera cambios', () => {
    expect(payloadActualizarNodo(nodo, valoresDesdeNodo(nodo))).toBeNull();
  });
});
