// RF-30B: taxonomía de variables (editor de nodos y gestión). Reglas puras;
// el backend sigue siendo quien decide (422/409 con su `message`).
import { TIPO_ENTRADA_ETIQUETA } from '../types/tipoEntrada.js';
import {
  ENTRADAS_POR_TIPO_VALOR,
  TIPO_VALOR_VARIABLE,
  TIPO_VALOR_VARIABLE_ETIQUETA,
} from '../types/tipoValorVariable.js';

const CODIGO_VALIDO = /^[A-Z][A-Z0-9_]{1,59}$/;

// Variable del catálogo por código (o null).
export function variablePorCodigo(variables, codigo) {
  if (!codigo) return null;
  return (variables ?? []).find((v) => v.codigo === codigo) ?? null;
}

// Selector "Variable que captura". Una variable deshabilitada (o ausente)
// que el nodo ya tenía se conserva como opción para que el admin la vea.
export function opcionesVariable(variables, codigoActual = '') {
  const lista = (variables ?? []).filter(
    (v) => v.habilitada !== false || v.codigo === codigoActual,
  );
  const opciones = lista.map((v) => ({
    value: v.codigo,
    label: v.habilitada === false ? `${v.nombre} (deshabilitada)` : v.nombre,
  }));
  if (codigoActual && !lista.some((v) => v.codigo === codigoActual)) {
    opciones.push({
      value: codigoActual,
      label: `${codigoActual} (no disponible)`,
    });
  }
  return opciones;
}

// Tipos de respuesta que admite la variable (null = sin filtro).
export function tiposEntradaPermitidos(variable) {
  return variable?.tipos_entrada_permitidos ?? null;
}

export function admiteTipoEntrada(variable, tipo) {
  const permitidos = tiposEntradaPermitidos(variable);
  return permitidos === null || permitidos.includes(tipo);
}

// Texto corto: "Escala numérica o Número".
export function describirEntradasPermitidas(variable) {
  return (tiposEntradaPermitidos(variable) ?? [])
    .map((tipo) => TIPO_ENTRADA_ETIQUETA[tipo] ?? tipo)
    .join(' o ');
}

function textoRango(regla) {
  if (regla.max === null) return `${regla.min} o más`;
  if (regla.min === regla.max) return `${regla.min}`;
  return `${regla.min} a ${regla.max}`;
}

// Reglas de etiqueta legibles: [{ clave, rango, etiqueta }].
export function describirEtiquetas(variable) {
  if (!variable) return [];
  const { tipo_valor: tipo, etiquetas, valores } = variable;
  if (tipo === TIPO_VALOR_VARIABLE.ENTERO) {
    return (Array.isArray(etiquetas) ? etiquetas : []).map((regla) => ({
      clave: String(regla.min),
      rango: textoRango(regla),
      etiqueta: regla.etiqueta,
    }));
  }
  if (tipo === TIPO_VALOR_VARIABLE.BOOLEANO) {
    return [
      { clave: 'true', rango: 'Sí', etiqueta: etiquetas?.true ?? '' },
      { clave: 'false', rango: 'No', etiqueta: etiquetas?.false ?? '' },
    ];
  }
  return (valores ?? []).map((valor) => ({
    clave: valor,
    rango: valor,
    etiqueta: etiquetas?.[valor] ?? valor,
  }));
}

export function etiquetaTipoValor(tipo) {
  return TIPO_VALOR_VARIABLE_ETIQUETA[tipo] ?? tipo;
}

// Al elegir una variable en el nodo: si el tipo de respuesta actual no es
// admitido, pasa al primero permitido; una variable CATEGORIA precarga sus
// valores como opciones cuando el nodo aún no tiene opciones escritas.
export function ajustarNodoAVariable(valores, variable) {
  if (!variable) return valores;
  const siguientes = { ...valores, tieneEntrada: true };
  const permitidos = tiposEntradaPermitidos(variable) ?? [];
  if (!permitidos.includes(siguientes.entradaTipo) && permitidos.length > 0) {
    siguientes.entradaTipo = permitidos[0];
  }
  const sinOpciones = (siguientes.entradaOpciones ?? []).every(
    (o) => !o.valor.trim(),
  );
  if (variable.tipo_valor === TIPO_VALOR_VARIABLE.CATEGORIA && sinOpciones) {
    siguientes.entradaOpciones = (variable.valores ?? []).map((valor) => ({
      valor,
      etiqueta: '',
    }));
  }
  return siguientes;
}

// Validación del nodo contra su variable (el backend repite la regla).
export function validarNodoContraVariable(valores, variable) {
  if (!valores.variableCodigo) return {};
  if (!variable) {
    return { variableCodigo: 'Esta variable no existe en la taxonomía.' };
  }
  if (variable.habilitada === false) {
    return {
      variableCodigo:
        'La variable está deshabilitada: elige otra o quita la variable.',
    };
  }
  if (valores.esNodoFinal) {
    return { variableCodigo: 'El nodo final no puede capturar variables.' };
  }
  if (
    !valores.tieneEntrada ||
    !admiteTipoEntrada(variable, valores.entradaTipo)
  ) {
    return {
      variableCodigo: `Esta variable solo admite: ${describirEntradasPermitidas(variable)}.`,
    };
  }
  if (variable.tipo_valor === TIPO_VALOR_VARIABLE.CATEGORIA) {
    const fuera = (valores.entradaOpciones ?? [])
      .map((o) => o.valor.trim())
      .filter((v) => v && !(variable.valores ?? []).includes(v));
    if (fuera.length > 0) {
      return {
        entradaOpciones: `Opciones fuera de la variable: ${fuera.join(', ')}.`,
      };
    }
  }
  return {};
}

// ── Formulario de creación ─────────────────────────────────────────────────

export function rangoVacio() {
  return { min: '', max: '', etiqueta: '' };
}

export function categoriaVacia() {
  return { valor: '', etiqueta: '' };
}

export const VALORES_VARIABLE_VACIOS = Object.freeze({
  codigo: '',
  nombre: '',
  descripcion: '',
  tipoValor: TIPO_VALOR_VARIABLE.ENTERO,
  tiposEntrada: [...ENTRADAS_POR_TIPO_VALOR[TIPO_VALOR_VARIABLE.ENTERO]],
  rangos: [rangoVacio()],
  categorias: [categoriaVacia(), categoriaVacia()],
  etiquetaSi: '',
  etiquetaNo: '',
});

// Cambiar el tipo de valor reinicia las entradas a todas las admitidas.
export function valoresVariableCambiados(valores, campo, valor) {
  const siguientes = { ...valores, [campo]: valor };
  if (campo === 'tipoValor' && valor !== valores.tipoValor) {
    siguientes.tiposEntrada = [...ENTRADAS_POR_TIPO_VALOR[valor]];
  }
  if (campo === 'codigo') siguientes.codigo = String(valor).toUpperCase();
  return siguientes;
}

const esEntero = (texto) => /^-?\d+$/.test(String(texto).trim());
const vacio = (texto) => String(texto).trim() === '';

function validarRangos(rangos) {
  const malo = rangos.some(
    (r) =>
      !esEntero(r.min) ||
      (!vacio(r.max) && !esEntero(r.max)) ||
      !r.etiqueta.trim() ||
      (!vacio(r.max) && Number(r.max) < Number(r.min)),
  );
  if (rangos.length === 0 || malo) {
    return 'Cada rango necesita mínimo entero, máximo entero mayor o igual (vacío = sin tope) y etiqueta.';
  }
  const orden = [...rangos].sort((a, b) => Number(a.min) - Number(b.min));
  for (let i = 1; i < orden.length; i += 1) {
    const anterior = orden[i - 1];
    if (vacio(anterior.max) || Number(anterior.max) >= Number(orden[i].min)) {
      return 'Los rangos no pueden solaparse.';
    }
  }
  return null;
}

export function validarVariable(valores) {
  const errores = {};
  if (!CODIGO_VALIDO.test(valores.codigo.trim())) {
    errores.codigo =
      'Usa mayúsculas, dígitos y guion bajo; empieza por letra (2 a 60).';
  }
  if (!valores.nombre.trim()) errores.nombre = 'Escribe el nombre.';
  if (valores.tiposEntrada.length === 0) {
    errores.tiposEntrada = 'Elige al menos un tipo de respuesta.';
  }

  if (valores.tipoValor === TIPO_VALOR_VARIABLE.ENTERO) {
    const error = validarRangos(valores.rangos);
    if (error) errores.rangos = error;
  }
  if (valores.tipoValor === TIPO_VALOR_VARIABLE.CATEGORIA) {
    const lista = valores.categorias.map((c) => c.valor.trim()).filter(Boolean);
    if (lista.length < 2) {
      errores.categorias = 'Escribe al menos dos categorías.';
    } else if (new Set(lista).size !== lista.length) {
      errores.categorias = 'Las categorías no pueden repetirse.';
    }
  }
  if (valores.tipoValor === TIPO_VALOR_VARIABLE.BOOLEANO) {
    if (!valores.etiquetaSi.trim() || !valores.etiquetaNo.trim()) {
      errores.etiquetasBooleano = 'Escribe la etiqueta del Sí y la del No.';
    }
  }
  return errores;
}

export function payloadCrearVariable(valores) {
  const payload = {
    codigo: valores.codigo.trim(),
    nombre: valores.nombre.trim(),
    tipo_valor: valores.tipoValor,
    tipos_entrada_permitidos: valores.tiposEntrada,
  };
  if (valores.descripcion.trim()) {
    payload.descripcion = valores.descripcion.trim();
  }

  if (valores.tipoValor === TIPO_VALOR_VARIABLE.ENTERO) {
    payload.etiquetas = valores.rangos.map((r) => ({
      min: Number(r.min),
      max: vacio(r.max) ? null : Number(r.max),
      etiqueta: r.etiqueta.trim(),
    }));
  } else if (valores.tipoValor === TIPO_VALOR_VARIABLE.CATEGORIA) {
    const categorias = valores.categorias.filter((c) => c.valor.trim());
    payload.valores = categorias.map((c) => c.valor.trim());
    payload.etiquetas = Object.fromEntries(
      categorias
        .filter((c) => c.etiqueta.trim())
        .map((c) => [c.valor.trim(), c.etiqueta.trim()]),
    );
  } else {
    payload.etiquetas = {
      true: valores.etiquetaSi.trim(),
      false: valores.etiquetaNo.trim(),
    };
  }
  return payload;
}
