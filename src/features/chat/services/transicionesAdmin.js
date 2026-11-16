// RF-25 (03-E/03-F, PR4): formulario de transiciones (crear y editar) de un
// flujo en borrador. Una transición necesita, además del nodo origen y
// destino, una regla de validación: exactamente una de "reutilizar una
// regla existente" (`id_regla_validacion`) o "definir una nueva" embebida
// (`regla_validacion`), nunca ambas (lo exige el backend).
import { FORMATO_TEXTO_PRESET } from '../types/formatoTextoPreset.js';
import { OPERADOR_CONDICION } from '../types/operadorCondicion.js';
import {
  TIPO_DATO_VALIDACION,
  TIPO_DATO_VALIDACION_ETIQUETA,
} from '../types/tipoDatoValidacion.js';

export const MODO_REGLA = Object.freeze({
  EXISTENTE: 'existente',
  NUEVA: 'nueva',
});

export const VALORES_TRANSICION_VACIOS = Object.freeze({
  idNodoOrigen: '',
  idNodoDestino: '',
  operadorCondicion: OPERADOR_CONDICION.IGUALDAD,
  valorIgualdad: '',
  valorMin: '',
  valorMax: '',
  valorCategoria: '',
  ordenEvaluacion: '',
  modoRegla: MODO_REGLA.EXISTENTE,
  idReglaValidacion: '',
  reglaTipoDato: TIPO_DATO_VALIDACION.TEXTO,
  reglaObligatorio: true,
  reglaValorMin: '',
  reglaValorMax: '',
  // Nombre de un formato predefinido (FORMATO_TEXTO_PRESET): el administrativo
  // elige por nombre, nunca escribe una expresión regular.
  reglaFormatoPreset: 'CUALQUIERA',
  reglaValoresPermitidos: '',
  reglaMensajeError: '',
});

function valorCondicionDesdeTransicion(transicion) {
  const c = transicion.valorCondicion;

  switch (transicion.operador) {
    case OPERADOR_CONDICION.IGUALDAD:
      return {
        valorIgualdad:
          c && typeof c === 'object' && 'valor' in c
            ? String(c.valor ?? '')
            : '',
      };
    case OPERADOR_CONDICION.RANGO:
      return {
        valorMin: c?.min !== undefined ? String(c.min) : '',
        valorMax: c?.max !== undefined ? String(c.max) : '',
      };
    case OPERADOR_CONDICION.CATEGORIA:
      return {
        valorCategoria: Array.isArray(c?.valores) ? c.valores.join(', ') : '',
      };
    default:
      return {};
  }
}

// Prefijo del editor al editar una transición existente. El modo de regla
// arranca en "existente", apuntando a la regla que ya tenía.
export function valoresDesdeTransicion(transicion) {
  return {
    ...VALORES_TRANSICION_VACIOS,
    idNodoOrigen: transicion.origenId,
    idNodoDestino: transicion.destinoId,
    operadorCondicion: transicion.operador,
    ordenEvaluacion: String(transicion.ordenEvaluacion ?? ''),
    modoRegla: MODO_REGLA.EXISTENTE,
    idReglaValidacion: transicion.idReglaValidacion ?? '',
    ...valorCondicionDesdeTransicion(transicion),
  };
}

// Nodos del árbol como opciones del selector (origen/destino), por etiqueta.
export function opcionesNodo(nodos) {
  return (Array.isArray(nodos) ? nodos : []).map((nodo) => ({
    value: nodo.id,
    label: nodo.etiqueta,
  }));
}

// Presets de formato de texto como opciones del selector (sin exponer el
// regex real al administrativo).
export function opcionesFormatoTexto() {
  return Object.entries(FORMATO_TEXTO_PRESET).map(([clave, preset]) => ({
    value: clave,
    label: preset.label,
  }));
}

// Catálogo `reglas_validacion` → opciones del selector "regla existente".
export function opcionesReglaValidacion(reglasValidacion) {
  return (Array.isArray(reglasValidacion) ? reglasValidacion : []).map(
    (regla) => ({
      value: regla.id_regla_validacion,
      label: `${
        TIPO_DATO_VALIDACION_ETIQUETA[regla.tipo_dato] ?? regla.tipo_dato
      } · ${regla.mensaje_error}`,
    }),
  );
}

// Devuelve un objeto con un mensaje por campo inválido ({} si todo es válido).
export function validarTransicion(valores) {
  const errores = {};

  if (!valores.idNodoOrigen) errores.idNodoOrigen = 'Elige el nodo de origen.';
  if (!valores.idNodoDestino) {
    errores.idNodoDestino = 'Elige el nodo de destino.';
  } else if (valores.idNodoOrigen === valores.idNodoDestino) {
    errores.idNodoDestino = 'El destino no puede ser el mismo nodo de origen.';
  }

  switch (valores.operadorCondicion) {
    case OPERADOR_CONDICION.IGUALDAD:
      if (!valores.valorIgualdad.trim()) {
        errores.valorIgualdad = 'Escribe el valor esperado de la respuesta.';
      }
      break;
    case OPERADOR_CONDICION.RANGO: {
      const min = valores.valorMin.trim();
      const max = valores.valorMax.trim();
      if (min === '' && max === '') {
        errores.valorMin = 'Indica al menos un límite (mínimo o máximo).';
      } else if (min !== '' && max !== '' && Number(min) > Number(max)) {
        errores.valorMax = 'El máximo debe ser mayor o igual que el mínimo.';
      }
      break;
    }
    case OPERADOR_CONDICION.CATEGORIA:
      if (!valores.valorCategoria.trim()) {
        errores.valorCategoria =
          'Escribe al menos un valor, separado por comas.';
      }
      break;
    default:
      break;
  }

  if (!/^[1-9]\d*$/.test(String(valores.ordenEvaluacion).trim())) {
    errores.ordenEvaluacion =
      'El orden de evaluación debe ser un número entero desde 1.';
  }

  if (valores.modoRegla === MODO_REGLA.EXISTENTE) {
    if (!valores.idReglaValidacion) {
      errores.idReglaValidacion = 'Elige una regla de validación existente.';
    }
  } else {
    if (!valores.reglaMensajeError.trim()) {
      errores.reglaMensajeError = 'Escribe el mensaje de error de la regla.';
    }
    if (
      valores.reglaTipoDato === TIPO_DATO_VALIDACION.SELECCION &&
      !valores.reglaValoresPermitidos.trim()
    ) {
      errores.reglaValoresPermitidos =
        'Escribe al menos una opción, separada por comas.';
    }
    if (
      valores.reglaTipoDato === TIPO_DATO_VALIDACION.NUMERICO &&
      valores.reglaValorMin.trim() !== '' &&
      valores.reglaValorMax.trim() !== '' &&
      Number(valores.reglaValorMin) > Number(valores.reglaValorMax)
    ) {
      errores.reglaValorMax = 'El máximo debe ser mayor o igual que el mínimo.';
    }
  }

  return errores;
}

function construirValorCondicion(valores) {
  switch (valores.operadorCondicion) {
    case OPERADOR_CONDICION.IGUALDAD:
      return { valor: valores.valorIgualdad.trim() };
    case OPERADOR_CONDICION.RANGO: {
      const condicion = {};
      if (valores.valorMin.trim() !== '') {
        condicion.min = Number(valores.valorMin);
      }
      if (valores.valorMax.trim() !== '') {
        condicion.max = Number(valores.valorMax);
      }
      return condicion;
    }
    case OPERADOR_CONDICION.CATEGORIA:
      return {
        valores: valores.valorCategoria
          .split(',')
          .map((valor) => valor.trim())
          .filter(Boolean),
      };
    default:
      return {};
  }
}

function construirReglaEmbebida(valores) {
  const regla = {
    tipo_dato: valores.reglaTipoDato,
    obligatorio: valores.reglaObligatorio,
    mensaje_error: valores.reglaMensajeError.trim(),
  };

  if (valores.reglaTipoDato === TIPO_DATO_VALIDACION.NUMERICO) {
    if (valores.reglaValorMin.trim() !== '') {
      regla.valor_min = Number(valores.reglaValorMin);
    }
    if (valores.reglaValorMax.trim() !== '') {
      regla.valor_max = Number(valores.reglaValorMax);
    }
  }

  if (valores.reglaTipoDato === TIPO_DATO_VALIDACION.TEXTO) {
    const regex = FORMATO_TEXTO_PRESET[valores.reglaFormatoPreset]?.regex;
    if (regex) regla.formato_regex = regex;
  }

  if (valores.reglaTipoDato === TIPO_DATO_VALIDACION.SELECCION) {
    regla.valores_permitidos = valores.reglaValoresPermitidos
      .split(',')
      .map((valor) => valor.trim())
      .filter(Boolean);
  }

  return regla;
}

export function payloadCrearTransicion(valores) {
  const payload = {
    id_nodo_origen: valores.idNodoOrigen,
    id_nodo_destino: valores.idNodoDestino,
    operador_condicion: valores.operadorCondicion,
    valor_condicion: construirValorCondicion(valores),
    orden_evaluacion: Number(valores.ordenEvaluacion),
  };

  if (valores.modoRegla === MODO_REGLA.EXISTENTE) {
    payload.id_regla_validacion = valores.idReglaValidacion;
  } else {
    payload.regla_validacion = construirReglaEmbebida(valores);
  }

  return payload;
}

// Solo viaja lo que cambió (el backend rechaza un PATCH vacío). El origen
// nunca se envía: el backend no permite editarlo. Devuelve null sin cambios.
export function payloadActualizarTransicion(transicion, valores) {
  const cambios = {};

  if (valores.idNodoDestino !== transicion.destinoId) {
    cambios.id_nodo_destino = valores.idNodoDestino;
  }

  if (valores.operadorCondicion !== transicion.operador) {
    cambios.operador_condicion = valores.operadorCondicion;
  }

  const valorCondicionNuevo = construirValorCondicion(valores);
  if (
    valores.operadorCondicion !== transicion.operador ||
    JSON.stringify(valorCondicionNuevo) !==
      JSON.stringify(transicion.valorCondicion)
  ) {
    cambios.valor_condicion = valorCondicionNuevo;
  }

  const orden = Number(valores.ordenEvaluacion);
  if (orden !== transicion.ordenEvaluacion) {
    cambios.orden_evaluacion = orden;
  }

  if (valores.modoRegla === MODO_REGLA.EXISTENTE) {
    if (valores.idReglaValidacion !== transicion.idReglaValidacion) {
      cambios.id_regla_validacion = valores.idReglaValidacion;
    }
  } else {
    cambios.regla_validacion = construirReglaEmbebida(valores);
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
}
