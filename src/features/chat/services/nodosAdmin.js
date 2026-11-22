// RF-25: formulario de nodos (crear y editar) de un flujo en borrador.
// El contenido que se edita aquí es `contenido.texto` y, opcionalmente,
// `contenido.entrada` (PR4: qué respuesta espera el nodo); el resto de las
// claves de `contenido` se conservan intactas al editar.
import {
  ALIAS_TIPO_ENTRADA,
  FORMATO_FECHA,
  TIPO_ENTRADA,
  TIPO_ENTRADA_CONFIGURACION,
  TIPO_ENTRADA_ETIQUETA,
} from '../types/tipoEntrada.js';
import {
  DIMENSION_PERFIL_CLINICO,
  DIMENSION_PERFIL_CLINICO_ETIQUETA,
  VALOR_PERFIL_CLINICO,
  etiquetaValorPerfilClinico,
} from '../types/dimensionPerfilClinico.js';
import { admiteTipoEntrada } from './taxonomiaVariables.js';

// RF-30B: código de la variable taxonómica que captura el nodo
// (`contenido.variable.codigo`), o '' si no captura ninguna.
export function variableDesdeContenido(contenido) {
  const codigo = contenido?.variable?.codigo;
  return typeof codigo === 'string' ? codigo : '';
}

// RF-25/RF-27B: lee la marca de captura de perfil clínico del `contenido`
// guardado, incluyendo el alias legado `captura_perfil` en snake_case.
// Vacío ('') significa que el nodo no captura ninguna dimensión (o, en
// `valor`, que es una captura legado sin valor elegido).
export function capturaPerfilDesdeContenido(contenido) {
  const nueva = contenido?.capturaPerfil;
  if (nueva && typeof nueva === 'object') {
    return { dimension: nueva.dimension ?? '', valor: nueva.valor ?? '' };
  }
  if (typeof nueva === 'string') return { dimension: nueva, valor: '' };

  const legado = contenido?.captura_perfil;
  if (legado === 'tipo_dependencia') {
    return { dimension: DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA, valor: '' };
  }
  if (legado === 'tipo_craving') {
    return { dimension: DIMENSION_PERFIL_CLINICO.TIPO_CRAVING, valor: '' };
  }

  return { dimension: '', valor: '' };
}

// Resumen de la captura para la tarjeta del nodo: "Tipo de dependencia ·
// Tolerancia". Cadena vacía si el nodo no captura perfil.
export function resumenCapturaPerfil(contenido) {
  const { dimension, valor } = capturaPerfilDesdeContenido(contenido);
  if (!dimension) return '';
  const nombre = DIMENSION_PERFIL_CLINICO_ETIQUETA[dimension] ?? dimension;
  const etiqueta = etiquetaValorPerfilClinico(dimension, valor);
  return etiqueta ? `${nombre} · ${etiqueta}` : nombre;
}

// Valores excluyentes de la dimensión elegida, para el grupo de
// interruptores del formulario. [] si no hay dimensión.
export function opcionesValorPerfilClinico(dimension) {
  return VALOR_PERFIL_CLINICO[dimension] ?? [];
}

// Fila vacía del editor de opciones (selección única/múltiple): un campo
// de texto por opción, no un solo cajón con todas juntas.
export function opcionVacia() {
  return { valor: '', etiqueta: '' };
}

function opcionesVacias() {
  return [opcionVacia(), opcionVacia()];
}

export const VALORES_NODO_VACIOS = Object.freeze({
  idTipoNodo: '',
  texto: '',
  esNodoInicial: false,
  // RF-25: nodo de cierre del flujo (único; nunca también inicial).
  esNodoFinal: false,
  orden: '',
  // RF-25/RF-24: contenido del nodo (no una programación concreta).
  idContenido: '',
  // PR4: respuesta que espera el nodo. Sin "tieneEntrada" el nodo es
  // informativo (el estudiante solo confirma "Continuar").
  tieneEntrada: false,
  entradaTipo: TIPO_ENTRADA.OPCION_UNICA,
  entradaObligatorio: true,
  entradaOpciones: opcionesVacias(),
  entradaMinSelecciones: '',
  entradaMaxSelecciones: '',
  entradaMin: '',
  entradaMax: '',
  entradaEtiquetaMin: '',
  entradaEtiquetaMax: '',
  entradaMinPalabras: '',
  entradaMaxPalabras: '',
  entradaMaxCaracteres: '',
  entradaFormato: FORMATO_FECHA.FECHA_HORA,
  // RF-25/RF-27B: vacío = este nodo no captura perfil clínico. Con
  // dimensión, `capturaPerfilValor` es el valor que el nodo asigna.
  capturaPerfilDimension: '',
  capturaPerfilValor: '',
  // RF-30B: variable taxonómica (una por nodo, opcional).
  variableCodigo: '',
});

// Opciones del selector de dimensión de perfil clínico (RF-25/RF-27B).
export function opcionesDimensionPerfilClinico() {
  return Object.values(DIMENSION_PERFIL_CLINICO).map((dimension) => ({
    value: dimension,
    label: DIMENSION_PERFIL_CLINICO_ETIQUETA[dimension],
  }));
}

// RF-25: en árboles grupales el valor esperado de cada transición se elige
// de lo que define el nodo, así que no se ofrecen respuestas abiertas.
const TIPOS_OCULTOS_EN_GRUPAL = new Set([
  TIPO_ENTRADA.TEXTO_LIBRE,
  TIPO_ENTRADA.FECHA_HORA,
]);

export function tipoEntradaOcultoEnGrupal(tipo) {
  return TIPOS_OCULTOS_EN_GRUPAL.has(tipo);
}

// Opciones del selector de tipo de respuesta (CONTINUAR no se ofrece: es
// "sin respuesta", el estado por defecto de "tieneEntrada"). Un nodo antiguo
// de un tipo oculto conserva su tipo como opción para no perderlo al editar.
// RF-30B: con una variable elegida, solo se ofrecen los tipos que admite.
export function opcionesTipoEntrada(tipoActual, variable = null) {
  return Object.values(TIPO_ENTRADA)
    .filter(
      (tipo) =>
        tipo !== TIPO_ENTRADA.CONTINUAR &&
        (!TIPOS_OCULTOS_EN_GRUPAL.has(tipo) || tipo === tipoActual) &&
        admiteTipoEntrada(variable, tipo),
    )
    .map((tipo) => ({ value: tipo, label: TIPO_ENTRADA_ETIQUETA[tipo] }));
}

const numTexto = (valor) =>
  valor === null || valor === undefined ? '' : String(valor);

// Opciones guardadas → filas del editor (una por opción). Sin opciones
// guardadas (nodo nuevo o entrada de otro tipo), arranca con dos filas
// vacías para que el formulario no se vea sin nada que llenar.
function opcionesDesdeEntrada(opciones) {
  const lista = Array.isArray(opciones) ? opciones : [];

  return lista.length > 0
    ? lista.map((opcion) => ({
        valor: opcion?.valor ?? '',
        etiqueta:
          opcion?.etiqueta && opcion.etiqueta !== opcion.valor
            ? opcion.etiqueta
            : '',
      }))
    : opcionesVacias();
}

export function valoresDesdeNodo(nodo) {
  const entrada = nodo.entrada;
  const captura = capturaPerfilDesdeContenido(nodo.contenido);
  const tipoCanonico = entrada
    ? (ALIAS_TIPO_ENTRADA[entrada.tipo] ?? entrada.tipo)
    : TIPO_ENTRADA.OPCION_UNICA;

  return {
    idTipoNodo: nodo.idTipoNodo,
    texto: nodo.texto,
    esNodoInicial: nodo.esNodoInicial,
    esNodoFinal: nodo.esNodoFinal === true,
    orden: nodo.orden === null ? '' : String(nodo.orden),
    idContenido: nodo.idContenido ?? '',
    tieneEntrada: entrada != null,
    entradaTipo: tipoCanonico,
    entradaObligatorio: entrada?.obligatorio !== false,
    entradaOpciones: opcionesDesdeEntrada(entrada?.opciones),
    entradaMinSelecciones: numTexto(entrada?.min_selecciones),
    entradaMaxSelecciones: numTexto(entrada?.max_selecciones),
    entradaMin: numTexto(entrada?.min),
    entradaMax: numTexto(entrada?.max),
    entradaEtiquetaMin: entrada?.etiquetas?.min ?? '',
    entradaEtiquetaMax: entrada?.etiquetas?.max ?? '',
    entradaMinPalabras: numTexto(entrada?.min_palabras),
    entradaMaxPalabras: numTexto(entrada?.max_palabras),
    entradaMaxCaracteres: numTexto(entrada?.max_caracteres),
    entradaFormato: entrada?.formato ?? FORMATO_FECHA.FECHA_HORA,
    capturaPerfilDimension: captura.dimension,
    capturaPerfilValor: captura.valor,
    variableCodigo: variableDesdeContenido(nodo.contenido),
  };
}

// Catálogo `tipos_nodo` → opciones del selector.
export function opcionesTipoNodo(tiposNodo) {
  return (Array.isArray(tiposNodo) ? tiposNodo : []).map((tipo) => ({
    value: tipo.id_tipo_nodo,
    label: tipo.nombre,
  }));
}

// Resumen corto de la respuesta configurada (solo lectura, en la lista de
// nodos). Cadena vacía si el nodo no espera respuesta.
export function resumenEntradaNodo(entrada) {
  if (!entrada) return '';

  const tipoCanonico = ALIAS_TIPO_ENTRADA[entrada.tipo] ?? entrada.tipo;
  const etiqueta = TIPO_ENTRADA_ETIQUETA[tipoCanonico] ?? tipoCanonico;

  return entrada.obligatorio === false ? `${etiqueta} (opcional)` : etiqueta;
}

// Devuelve un objeto con un mensaje por campo inválido ({} si todo es
// válido). El backend exige `orden` solo al crear un nodo (no al editar
// uno existente), y rechaza huecos/duplicados y que el nodo inicial no
// tenga orden 1; esas dos reglas solo las valida el backend.
export function validarNodo(valores, { esEdicion = false } = {}) {
  const errores = {};

  if (!valores.idTipoNodo) errores.idTipoNodo = 'Elige el tipo de nodo.';
  if (!valores.texto.trim()) errores.texto = 'Escribe el texto del nodo.';

  const orden = String(valores.orden).trim();

  if (orden === '') {
    if (!esEdicion) {
      errores.orden = 'Indica el orden del nodo dentro del flujo.';
    }
  } else if (!/^[1-9]\d*$/.test(orden)) {
    errores.orden = 'El orden debe ser un número entero desde 1.';
  }

  // RF-25: el nodo final cierra la terapia; no abre el flujo ni espera
  // respuesta (el formulario ya lo impide, esto es la red de seguridad).
  if (valores.esNodoFinal && valores.esNodoInicial) {
    errores.esNodoFinal =
      'Un nodo no puede ser el inicial y el final del flujo a la vez.';
  }

  if (valores.tieneEntrada && !valores.esNodoFinal) {
    Object.assign(errores, validarEntrada(valores));
  }

  // RF-25/RF-27B: el nodo de captura asigna un valor concreto.
  if (valores.capturaPerfilDimension && !valores.capturaPerfilValor) {
    errores.capturaPerfilValor = 'Activa el valor que captura este nodo.';
  }

  return errores;
}

function numeroValido(texto) {
  return texto.trim() === '' ? null : Number(texto);
}

function validarEntrada(valores) {
  const errores = {};

  switch (valores.entradaTipo) {
    case TIPO_ENTRADA.OPCION_UNICA:
    case TIPO_ENTRADA.MULTISELECCION: {
      const opcionesValidas = (
        Array.isArray(valores.entradaOpciones) ? valores.entradaOpciones : []
      ).filter((opcion) => opcion.valor.trim() !== '');
      if (opcionesValidas.length < 2) {
        errores.entradaOpciones = 'Escribe al menos dos opciones.';
      }
      if (valores.entradaTipo !== TIPO_ENTRADA.MULTISELECCION) break;
      // RF-25: el valor esperado de sus transiciones respeta estos límites.
      const total = opcionesValidas.length;
      const min = numeroValido(valores.entradaMinSelecciones);
      const max = numeroValido(valores.entradaMaxSelecciones);
      if (min !== null && (min < 1 || min > total)) {
        errores.entradaMinSelecciones = `El mínimo debe estar entre 1 y ${total}.`;
      }
      if (max !== null && (max < 1 || max > total)) {
        errores.entradaMaxSelecciones = `El máximo debe estar entre 1 y ${total}.`;
      } else if (min !== null && max !== null && min > max) {
        errores.entradaMaxSelecciones =
          'El máximo debe ser mayor o igual que el mínimo.';
      }
      break;
    }
    case TIPO_ENTRADA.ESCALA:
    case TIPO_ENTRADA.NUMERICO: {
      // RF-25: el rango es la base de la regla de sus transiciones.
      const min = numeroValido(valores.entradaMin);
      const max = numeroValido(valores.entradaMax);
      if (min === null) errores.entradaMin = 'Indica el valor mínimo.';
      if (max === null) {
        errores.entradaMax = 'Indica el valor máximo.';
      } else if (min !== null && min >= max) {
        errores.entradaMax = 'El máximo debe ser mayor que el mínimo.';
      }
      break;
    }
    case TIPO_ENTRADA.TEXTO_LIBRE: {
      const min = numeroValido(valores.entradaMinPalabras);
      const max = numeroValido(valores.entradaMaxPalabras);
      if (min !== null && max !== null && min > max) {
        errores.entradaMaxPalabras =
          'El máximo debe ser mayor o igual que el mínimo.';
      }
      break;
    }
    default:
      break;
  }

  return errores;
}

function construirEntrada(valores) {
  const entrada = {
    tipo:
      TIPO_ENTRADA_CONFIGURACION[valores.entradaTipo] ?? valores.entradaTipo,
    obligatorio: valores.entradaObligatorio,
  };

  switch (valores.entradaTipo) {
    case TIPO_ENTRADA.OPCION_UNICA:
    case TIPO_ENTRADA.MULTISELECCION: {
      entrada.opciones = valores.entradaOpciones
        .filter((opcion) => opcion.valor.trim() !== '')
        .map((opcion) => ({
          valor: opcion.valor.trim(),
          etiqueta: opcion.etiqueta.trim() || opcion.valor.trim(),
        }));
      if (valores.entradaTipo === TIPO_ENTRADA.MULTISELECCION) {
        if (valores.entradaMinSelecciones.trim() !== '') {
          entrada.min_selecciones = Number(valores.entradaMinSelecciones);
        }
        if (valores.entradaMaxSelecciones.trim() !== '') {
          entrada.max_selecciones = Number(valores.entradaMaxSelecciones);
        }
      }
      break;
    }
    case TIPO_ENTRADA.ESCALA:
    case TIPO_ENTRADA.NUMERICO: {
      if (valores.entradaMin.trim() !== '') {
        entrada.min = Number(valores.entradaMin);
      }
      if (valores.entradaMax.trim() !== '') {
        entrada.max = Number(valores.entradaMax);
      }
      // RF-25: la escala numérica avanza de 1 en 1; ya no se configura paso.
      if (valores.entradaTipo === TIPO_ENTRADA.ESCALA) {
        if (
          valores.entradaEtiquetaMin.trim() !== '' ||
          valores.entradaEtiquetaMax.trim() !== ''
        ) {
          entrada.etiquetas = {
            min: valores.entradaEtiquetaMin.trim(),
            max: valores.entradaEtiquetaMax.trim(),
          };
        }
      }
      break;
    }
    case TIPO_ENTRADA.TEXTO_LIBRE: {
      if (valores.entradaMinPalabras.trim() !== '') {
        entrada.min_palabras = Number(valores.entradaMinPalabras);
      }
      if (valores.entradaMaxPalabras.trim() !== '') {
        entrada.max_palabras = Number(valores.entradaMaxPalabras);
      }
      if (valores.entradaMaxCaracteres.trim() !== '') {
        entrada.max_caracteres = Number(valores.entradaMaxCaracteres);
      }
      break;
    }
    case TIPO_ENTRADA.FECHA_HORA: {
      entrada.formato = valores.entradaFormato;
      if (valores.entradaMin.trim() !== '')
        entrada.min = valores.entradaMin.trim();
      if (valores.entradaMax.trim() !== '')
        entrada.max = valores.entradaMax.trim();
      break;
    }
    default:
      break;
  }

  return entrada;
}

// El nodo final nunca lleva respuesta ni captura (RF-25).
function esperaRespuesta(valores) {
  return valores.tieneEntrada && !valores.esNodoFinal;
}

function capturaPerfil(valores) {
  return valores.capturaPerfilDimension && !valores.esNodoFinal
    ? {
        dimension: valores.capturaPerfilDimension,
        valor: valores.capturaPerfilValor,
      }
    : null;
}

function variableNodo(valores) {
  return valores.variableCodigo && !valores.esNodoFinal
    ? { codigo: valores.variableCodigo }
    : null;
}

export function payloadCrearNodo(valores) {
  const contenido = { texto: valores.texto };
  if (esperaRespuesta(valores)) contenido.entrada = construirEntrada(valores);
  const captura = capturaPerfil(valores);
  if (captura) contenido.capturaPerfil = captura;
  const variable = variableNodo(valores);
  if (variable) contenido.variable = variable;

  const payload = {
    id_tipo_nodo: valores.idTipoNodo,
    contenido,
    es_nodo_inicial: valores.esNodoInicial,
    es_nodo_final: valores.esNodoFinal,
  };
  const orden = String(valores.orden).trim();

  if (orden !== '') payload.orden = Number(orden);
  if (valores.idContenido) {
    payload.id_contenido = valores.idContenido;
  }

  return payload;
}

// Solo viaja lo que cambió (el backend rechaza un PATCH vacío). Devuelve
// null si no hay cambios.
export function payloadActualizarNodo(nodo, valores) {
  const cambios = {};
  const orden =
    String(valores.orden).trim() === '' ? null : Number(valores.orden);
  const idContenido = valores.idContenido || null;

  if (valores.idTipoNodo !== nodo.idTipoNodo)
    cambios.id_tipo_nodo = valores.idTipoNodo;

  const entradaNueva = esperaRespuesta(valores)
    ? construirEntrada(valores)
    : null;
  const entradaCambio =
    JSON.stringify(entradaNueva) !== JSON.stringify(nodo.entrada ?? null);
  const capturaNueva = capturaPerfil(valores);
  const capturaActual = capturaPerfilDesdeContenido(nodo.contenido);
  const capturaPerfilCambio =
    (capturaNueva?.dimension ?? '') !== capturaActual.dimension ||
    (capturaNueva?.valor ?? '') !== capturaActual.valor;

  const variableNueva = variableNodo(valores)?.codigo ?? '';
  const variableCambio =
    variableNueva !== variableDesdeContenido(nodo.contenido);

  if (
    valores.texto !== nodo.texto ||
    entradaCambio ||
    capturaPerfilCambio ||
    variableCambio
  ) {
    const contenido = { ...nodo.contenido, texto: valores.texto };
    if (entradaNueva) contenido.entrada = entradaNueva;
    else delete contenido.entrada;
    if (capturaPerfilCambio) {
      delete contenido.captura_perfil;
      if (capturaNueva) contenido.capturaPerfil = capturaNueva;
      else delete contenido.capturaPerfil;
    }
    if (variableNueva) contenido.variable = { codigo: variableNueva };
    else delete contenido.variable;
    cambios.contenido = contenido;
  }

  if (valores.esNodoInicial !== nodo.esNodoInicial) {
    cambios.es_nodo_inicial = valores.esNodoInicial;
  }
  if (valores.esNodoFinal !== (nodo.esNodoFinal === true)) {
    cambios.es_nodo_final = valores.esNodoFinal;
  }
  if (orden !== nodo.orden) cambios.orden = orden;
  if (idContenido !== (nodo.idContenido ?? null)) {
    cambios.id_contenido = idContenido;
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
}

// RF-25: tipo de respuesta efectivo (CONTINUAR = sin respuesta).
function tipoRespuesta(entrada) {
  if (!entrada) return TIPO_ENTRADA.CONTINUAR;
  return ALIAS_TIPO_ENTRADA[entrada.tipo] ?? entrada.tipo;
}

// RF-25: transiciones de salida que dejan de tener sentido si se guarda el
// nodo con estos valores (sus reglas se derivan del tipo de respuesta). El
// backend exige confirmar su eliminación (409 TRANSICIONES_AFECTADAS).
export function transicionesAfectadasPorCambio(nodo, valores, transiciones) {
  if (!nodo) return [];
  const antes = tipoRespuesta(nodo.entrada);
  const despues = esperaRespuesta(valores)
    ? valores.entradaTipo
    : TIPO_ENTRADA.CONTINUAR;
  if (antes === despues) return [];
  return (Array.isArray(transiciones) ? transiciones : []).filter(
    (t) => t.origenId === nodo.id,
  );
}
