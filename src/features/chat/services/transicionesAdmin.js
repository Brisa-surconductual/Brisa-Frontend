// RF-25: formulario de transiciones (crear y editar) de un flujo en borrador.
// Cada transición tiene su propia regla (nunca se reutiliza). El operador y
// el valor esperado se derivan del tipo de respuesta del nodo origen: el
// administrativo nunca escribe el valor esperado, lo elige de lo que el nodo
// ya define (o acota un rango dentro del rango del nodo). Las reglas se
// duplican aquí solo para avisar antes de guardar: la validación real es la
// del backend (`regla-por-tipo-entrada.ts`).
import {
  OPERADOR_CONDICION,
  OPERADOR_CONDICION_ETIQUETA,
} from '../types/operadorCondicion.js';
import { ALIAS_TIPO_ENTRADA, TIPO_ENTRADA } from '../types/tipoEntrada.js';

export const VALORES_TRANSICION_VACIOS = Object.freeze({
  idNodoOrigen: '',
  idNodoDestino: '',
  ordenEvaluacion: '',
  // Solo se elige en un nodo de tipo número; en los demás es fijo.
  operador: '',
  // Selección única, Sí/No y número por igualdad (valor de un selector).
  valorUnico: '',
  // Selección múltiple.
  valoresMultiples: [],
  rangoMin: '',
  rangoMax: '',
  mensajeError: '',
  // RF-25: destino de "cualquier otra respuesta" (transición SIEMPRE del
  // origen). Vacío = no se define o no se cambia.
  idNodoDestinoOtro: '',
  // RF-25: se está editando la transición "cualquier otra respuesta"; solo
  // se cambia su destino (su orden lo fija el backend: siempre última).
  esPorDefecto: false,
});

const TIPOS_NO_SOPORTADOS = new Set([
  TIPO_ENTRADA.TEXTO_LIBRE,
  TIPO_ENTRADA.FECHA_HORA,
]);

const OPCIONES_SI_NO = Object.freeze([
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
]);

const opcionOperador = (operador) => ({
  value: operador,
  label: OPERADOR_CONDICION_ETIQUETA[operador],
});

const numero = (valor) =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : null;

function tipoEntrada(entrada) {
  const crudo = entrada?.tipo;
  if (!crudo) return TIPO_ENTRADA.CONTINUAR;
  return ALIAS_TIPO_ENTRADA[crudo] ?? crudo;
}

function opcionesDeEntrada(entrada) {
  return (Array.isArray(entrada?.opciones) ? entrada.opciones : []).map(
    (opcion) => ({ value: opcion.valor, label: opcion.etiqueta }),
  );
}

// Valores de `min` a `max` con el `paso` del nodo (1 si no lo define).
function valoresDelRango(min, max, paso) {
  const salto = numero(paso) && paso > 0 ? paso : 1;
  const valores = [];
  for (let i = 0; min + i * salto <= max + 1e-9 && i <= 1000; i += 1) {
    const valor = Number((min + i * salto).toFixed(10));
    valores.push({ value: String(valor), label: String(valor) });
  }
  return valores;
}

// Qué pide el formulario según el nodo origen elegido.
export function configuracionReglaTransicion(nodoOrigen) {
  if (!nodoOrigen) return { tipo: null };

  const entrada = nodoOrigen.entrada;
  const tipo = tipoEntrada(entrada);

  if (tipo === TIPO_ENTRADA.CONTINUAR) return { tipo, sinRegla: true };
  if (TIPOS_NO_SOPORTADOS.has(tipo)) return { tipo, noSoportado: true };

  switch (tipo) {
    case TIPO_ENTRADA.OPCION_UNICA:
      return {
        tipo,
        operadorFijo: OPERADOR_CONDICION.IGUALDAD,
        etiquetas: { tipoDato: 'Texto', formato: 'Cualquier texto' },
        opciones: opcionesDeEntrada(entrada),
      };
    case TIPO_ENTRADA.MULTISELECCION: {
      const opciones = opcionesDeEntrada(entrada);
      return {
        tipo,
        operadorFijo: OPERADOR_CONDICION.IGUALDAD,
        etiquetas: { tipoDato: 'Texto', formato: 'Cualquier texto' },
        opciones,
        minSelecciones: numero(entrada.min_selecciones) ?? 1,
        maxSelecciones: numero(entrada.max_selecciones) ?? opciones.length,
      };
    }
    case TIPO_ENTRADA.BOOLEANO:
      return {
        tipo,
        operadorFijo: OPERADOR_CONDICION.IGUALDAD,
        etiquetas: { tipoDato: 'Selección' },
        opciones: OPCIONES_SI_NO,
      };
    case TIPO_ENTRADA.ESCALA:
    case TIPO_ENTRADA.NUMERICO: {
      const min = numero(entrada.min);
      const max = numero(entrada.max);
      if (min === null || max === null) return { tipo, faltaRango: true };
      const esEscala = tipo === TIPO_ENTRADA.ESCALA;
      return {
        tipo,
        operadorFijo: esEscala ? OPERADOR_CONDICION.RANGO : null,
        operadores: esEscala
          ? [opcionOperador(OPERADOR_CONDICION.RANGO)]
          : [
              opcionOperador(OPERADOR_CONDICION.IGUALDAD),
              opcionOperador(OPERADOR_CONDICION.RANGO),
            ],
        etiquetas: { tipoDato: 'Numérico' },
        min,
        max,
        valores: esEscala ? [] : valoresDelRango(min, max, entrada.paso),
      };
    }
    default:
      return { tipo, noSoportado: true };
  }
}

export function operadorEfectivo(config, valores) {
  return config.operadorFijo ?? valores.operador;
}

// Nodos del árbol como opciones del selector de destino, por etiqueta.
export function opcionesNodo(nodos) {
  return (Array.isArray(nodos) ? nodos : []).map((nodo) => ({
    value: nodo.id,
    label: nodo.etiqueta,
  }));
}

// Origen: no se ofrecen nodos de texto libre ni de fecha u hora (su valor
// esperado no se puede elegir de opciones) ni el nodo final (RF-25: no
// tiene salidas).
export function opcionesNodoOrigen(nodos) {
  return opcionesNodo(
    (Array.isArray(nodos) ? nodos : []).filter(
      (nodo) =>
        !nodo.esNodoFinal &&
        !TIPOS_NO_SOPORTADOS.has(tipoEntrada(nodo.entrada)),
    ),
  );
}

// RF-25: el destino nunca es el propio origen ni el nodo inicial (el flujo
// no puede volver a empezar). El backend valida lo mismo.
export function opcionesNodoDestino(nodos, idNodoOrigen) {
  return opcionesNodo(
    (Array.isArray(nodos) ? nodos : []).filter(
      (nodo) => nodo.id !== idNodoOrigen && !nodo.esNodoInicial,
    ),
  );
}

function transicionesDeOrigen(transiciones, idNodoOrigen) {
  return (Array.isArray(transiciones) ? transiciones : []).filter(
    (t) => t.origenId === idNodoOrigen,
  );
}

// RF-25: orden sugerido = máximo de las transiciones específicas del origen
// + 1 ("cualquier otra respuesta" no cuenta: siempre va última).
export function ordenEvaluacionSugerido(transiciones, idNodoOrigen) {
  if (!idNodoOrigen) return '';
  const ordenes = transicionesDeOrigen(transiciones, idNodoOrigen)
    .filter((t) => !t.esPorDefecto)
    .map((t) => t.ordenEvaluacion);
  return String(ordenes.length === 0 ? 1 : Math.max(...ordenes) + 1);
}

// Cuántas transiciones específicas tiene ya el origen (para el hint).
export function totalTransicionesEspecificas(transiciones, idNodoOrigen) {
  return transicionesDeOrigen(transiciones, idNodoOrigen).filter(
    (t) => !t.esPorDefecto,
  ).length;
}

// RF-25: destino actual de "cualquier otra respuesta" del origen ('' si no hay).
export function destinoPorDefectoActual(transiciones, idNodoOrigen) {
  return (
    transicionesDeOrigen(transiciones, idNodoOrigen).find((t) => t.esPorDefecto)
      ?.destinoId ?? ''
  );
}

function validarRegla(valores, config, errores) {
  if (config.noSoportado) {
    errores.idNodoOrigen =
      'No se pueden crear transiciones desde una respuesta de texto libre o de fecha u hora.';
    return;
  }
  if (config.faltaRango) {
    errores.idNodoOrigen =
      'Configura el mínimo y el máximo de la respuesta en el nodo origen.';
    return;
  }

  const operador = operadorEfectivo(config, valores);
  if (!operador) {
    errores.operador = 'Elige el operador de la condición.';
  } else if (config.tipo === TIPO_ENTRADA.MULTISELECCION) {
    const cantidad = valores.valoresMultiples.length;
    if (cantidad < config.minSelecciones || cantidad > config.maxSelecciones) {
      errores.valoresMultiples =
        config.minSelecciones === config.maxSelecciones
          ? `Marca ${config.minSelecciones} opciones.`
          : `Marca entre ${config.minSelecciones} y ${config.maxSelecciones} opciones.`;
    }
  } else if (operador === OPERADOR_CONDICION.RANGO) {
    const min = valores.rangoMin.trim();
    const max = valores.rangoMax.trim();
    if (min === '' || Number(min) < config.min || Number(min) > config.max) {
      errores.rangoMin = `Indica un mínimo entre ${config.min} y ${config.max}.`;
    }
    if (max === '' || Number(max) < config.min || Number(max) > config.max) {
      errores.rangoMax = `Indica un máximo entre ${config.min} y ${config.max}.`;
    } else if (min !== '' && Number(min) > Number(max)) {
      errores.rangoMax = 'El máximo debe ser mayor o igual que el mínimo.';
    }
  } else if (!valores.valorUnico) {
    errores.valorUnico = 'Elige el valor esperado de la respuesta.';
  }

  if (!valores.mensajeError.trim()) {
    errores.mensajeError = 'Escribe el mensaje de error de la regla.';
  }
}

const MENSAJE_DESTINO_REPETIDO =
  'Es el mismo destino de "cualquier otra respuesta": elige otro para que el camino tenga sentido.';

// RF-25: destinos ya usados por las demás transiciones del origen (sin la
// que se edita): el de "cualquier otra respuesta" y los específicos.
export function destinosOcupadosDelOrigen(
  transiciones,
  idNodoOrigen,
  idTransicionEditada = null,
) {
  const otras = transicionesDeOrigen(transiciones, idNodoOrigen).filter(
    (t) => t.id !== idTransicionEditada,
  );
  return {
    destinoPorDefecto: otras.find((t) => t.esPorDefecto)?.destinoId ?? '',
    destinosEspecificos: otras
      .filter((t) => !t.esPorDefecto)
      .map((t) => t.destinoId),
  };
}

// Devuelve un objeto con un mensaje por campo inválido ({} si todo es válido).
// `ocupados` (de `destinosOcupadosDelOrigen`) evita que una transición
// específica y "cualquier otra respuesta" lleven al mismo nodo (RF-25).
export function validarTransicion(
  valores,
  config = { tipo: null },
  ocupados = { destinoPorDefecto: '', destinosEspecificos: [] },
) {
  const errores = {};

  if (!valores.idNodoOrigen) errores.idNodoOrigen = 'Elige el nodo de origen.';
  if (!valores.idNodoDestino) {
    errores.idNodoDestino = 'Elige el nodo de destino.';
  } else if (valores.idNodoOrigen === valores.idNodoDestino) {
    errores.idNodoDestino = 'El destino no puede ser el mismo nodo de origen.';
  }
  if (valores.idNodoDestinoOtro) {
    if (valores.idNodoDestinoOtro === valores.idNodoOrigen) {
      errores.idNodoDestinoOtro =
        'El destino no puede ser el mismo nodo de origen.';
    } else if (
      valores.idNodoDestinoOtro === valores.idNodoDestino ||
      ocupados.destinosEspecificos.includes(valores.idNodoDestinoOtro)
    ) {
      errores.idNodoDestinoOtro =
        'Ya hay una transición de este origen hacia ese nodo: "cualquier otra respuesta" debe ir a un destino distinto.';
    }
  }

  if (valores.idNodoDestino && !errores.idNodoDestino) {
    if (
      valores.esPorDefecto
        ? ocupados.destinosEspecificos.includes(valores.idNodoDestino)
        : !valores.idNodoDestinoOtro &&
          valores.idNodoDestino === ocupados.destinoPorDefecto
    ) {
      errores.idNodoDestino = valores.esPorDefecto
        ? 'Ya hay una transición de este origen hacia ese nodo: "cualquier otra respuesta" debe ir a un destino distinto.'
        : MENSAJE_DESTINO_REPETIDO;
    }
  }

  // RF-25: la transición "cualquier otra respuesta" solo cambia su destino.
  if (valores.esPorDefecto) return errores;

  if (!/^[1-9]\d*$/.test(String(valores.ordenEvaluacion).trim())) {
    errores.ordenEvaluacion =
      'El orden de evaluación debe ser un número entero desde 1.';
  }

  if (config.tipo === null) {
    if (!valores.valorUnico) {
      errores.valorUnico = 'Elige el valor esperado de la respuesta.';
    }
    if (!valores.mensajeError.trim()) {
      errores.mensajeError = 'Escribe el mensaje de error de la regla.';
    }
  } else if (!config.sinRegla) {
    validarRegla(valores, config, errores);
  }

  return errores;
}

function valorEsperado(valores, config) {
  const operador = operadorEfectivo(config, valores);
  if (operador === OPERADOR_CONDICION.RANGO) {
    return { min: Number(valores.rangoMin), max: Number(valores.rangoMax) };
  }
  switch (config.tipo) {
    case TIPO_ENTRADA.MULTISELECCION:
      return { valor: valores.valoresMultiples };
    case TIPO_ENTRADA.BOOLEANO:
      return { valor: valores.valorUnico === 'true' };
    case TIPO_ENTRADA.NUMERICO:
      return { valor: Number(valores.valorUnico) };
    default:
      return { valor: valores.valorUnico };
  }
}

// Lo que el backend recibe de la regla: el resto lo deriva del nodo origen.
function construirRegla(valores, config) {
  const regla = {
    valor_esperado: valorEsperado(valores, config),
    mensaje_error: valores.mensajeError.trim(),
  };
  return config.operadorFijo === null
    ? { operador_condicion: valores.operador, ...regla }
    : regla;
}

export function payloadCrearTransicion(valores, config) {
  const payload = {
    id_nodo_origen: valores.idNodoOrigen,
    id_nodo_destino: valores.idNodoDestino,
    orden_evaluacion: Number(valores.ordenEvaluacion),
  };
  if (!config.sinRegla) {
    payload.regla_validacion = construirRegla(valores, config);
    // RF-25: crea o redirige "cualquier otra respuesta" en la misma operación.
    if (valores.idNodoDestinoOtro) {
      payload.id_nodo_destino_otro = valores.idNodoDestinoOtro;
    }
  }
  return payload;
}

function reglaActual(transicion) {
  const regla = transicion.regla;
  if (!regla) return null;
  const actual = {
    valor_esperado: regla.valorEsperado,
    mensaje_error: regla.mensajeError,
  };
  return { operador: regla.operador, ...actual };
}

// Solo viaja lo que cambió (el backend rechaza un PATCH vacío). El origen
// nunca se envía. La regla, si cambió, se reemplaza completa.
export function payloadActualizarTransicion(transicion, valores, config) {
  const cambios = {};

  if (valores.idNodoDestino !== transicion.destinoId) {
    cambios.id_nodo_destino = valores.idNodoDestino;
  }
  // RF-25: en "cualquier otra respuesta" solo se edita el destino.
  if (transicion.esPorDefecto) {
    return Object.keys(cambios).length > 0 ? cambios : null;
  }
  const orden = Number(valores.ordenEvaluacion);
  if (orden !== transicion.ordenEvaluacion) cambios.orden_evaluacion = orden;

  if (!config.sinRegla) {
    const nueva = construirRegla(valores, config);
    const actual = reglaActual(transicion);
    const igual =
      actual !== null &&
      JSON.stringify(nueva.valor_esperado) ===
        JSON.stringify(actual.valor_esperado) &&
      nueva.mensaje_error === actual.mensaje_error &&
      operadorEfectivo(config, valores) === actual.operador;
    if (!igual) cambios.regla_validacion = nueva;
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
}

// Prefijo del editor al editar una transición existente.
export function valoresDesdeTransicion(transicion) {
  const regla = transicion.regla;
  const esperado = regla?.valorEsperado ?? {};
  const valores = {
    ...VALORES_TRANSICION_VACIOS,
    idNodoOrigen: transicion.origenId,
    idNodoDestino: transicion.destinoId,
    ordenEvaluacion: String(transicion.ordenEvaluacion ?? ''),
    operador: regla?.operador ?? '',
    mensajeError: regla?.mensajeError ?? '',
    esPorDefecto: transicion.esPorDefecto === true,
  };

  if (regla?.operador === OPERADOR_CONDICION.SIEMPRE) return valores;

  if (regla?.operador === OPERADOR_CONDICION.RANGO) {
    return {
      ...valores,
      rangoMin: String(esperado.min ?? ''),
      rangoMax: String(esperado.max ?? ''),
    };
  }
  if (Array.isArray(esperado.valor)) {
    return { ...valores, valoresMultiples: esperado.valor };
  }
  return {
    ...valores,
    valorUnico:
      esperado.valor === undefined || esperado.valor === null
        ? ''
        : String(esperado.valor),
  };
}
