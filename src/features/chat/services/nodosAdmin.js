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
} from '../types/dimensionPerfilClinico.js';

// RF-25/RF-27B: lee la marca de captura de perfil clínico del `contenido`
// guardado, incluyendo el alias legado `captura_perfil` en snake_case.
// Vacío ('') significa que el nodo no captura ninguna dimensión.
function capturaPerfilDesdeContenido(contenido) {
  const nueva = contenido?.capturaPerfil;
  if (nueva && typeof nueva === 'object') return nueva.dimension ?? '';
  if (typeof nueva === 'string') return nueva;

  const legado = contenido?.captura_perfil;
  if (legado === 'tipo_dependencia') {
    return DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA;
  }
  if (legado === 'tipo_craving') return DIMENSION_PERFIL_CLINICO.TIPO_CRAVING;

  return '';
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
  orden: '',
  idContenidoCronograma: '',
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
  entradaPaso: '',
  entradaEtiquetaMin: '',
  entradaEtiquetaMax: '',
  entradaMinPalabras: '',
  entradaMaxPalabras: '',
  entradaMaxCaracteres: '',
  entradaFormato: FORMATO_FECHA.FECHA_HORA,
  // RF-25/RF-27B: vacío = este nodo no captura perfil clínico.
  capturaPerfilDimension: '',
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
export function opcionesTipoEntrada(tipoActual) {
  return Object.values(TIPO_ENTRADA)
    .filter(
      (tipo) =>
        tipo !== TIPO_ENTRADA.CONTINUAR &&
        (!TIPOS_OCULTOS_EN_GRUPAL.has(tipo) || tipo === tipoActual),
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
  const tipoCanonico = entrada
    ? (ALIAS_TIPO_ENTRADA[entrada.tipo] ?? entrada.tipo)
    : TIPO_ENTRADA.OPCION_UNICA;

  return {
    idTipoNodo: nodo.idTipoNodo,
    texto: nodo.texto,
    esNodoInicial: nodo.esNodoInicial,
    orden: nodo.orden === null ? '' : String(nodo.orden),
    idContenidoCronograma: nodo.idContenidoCronograma ?? '',
    tieneEntrada: entrada != null,
    entradaTipo: tipoCanonico,
    entradaObligatorio: entrada?.obligatorio !== false,
    entradaOpciones: opcionesDesdeEntrada(entrada?.opciones),
    entradaMinSelecciones: numTexto(entrada?.min_selecciones),
    entradaMaxSelecciones: numTexto(entrada?.max_selecciones),
    entradaMin: numTexto(entrada?.min),
    entradaMax: numTexto(entrada?.max),
    entradaPaso: numTexto(entrada?.paso),
    entradaEtiquetaMin: entrada?.etiquetas?.min ?? '',
    entradaEtiquetaMax: entrada?.etiquetas?.max ?? '',
    entradaMinPalabras: numTexto(entrada?.min_palabras),
    entradaMaxPalabras: numTexto(entrada?.max_palabras),
    entradaMaxCaracteres: numTexto(entrada?.max_caracteres),
    entradaFormato: entrada?.formato ?? FORMATO_FECHA.FECHA_HORA,
    capturaPerfilDimension: capturaPerfilDesdeContenido(nodo.contenido),
  };
}

// Catálogo `tipos_nodo` → opciones del selector.
export function opcionesTipoNodo(tiposNodo) {
  return (Array.isArray(tiposNodo) ? tiposNodo : []).map((tipo) => ({
    value: tipo.id_tipo_nodo,
    label: tipo.nombre,
  }));
}

// Catálogo `contenidos_cronograma` → opciones del selector. Son contenidos
// ya asociados a una unidad temporal (nunca contenido sin cronograma).
export function opcionesContenidoCronograma(contenidosCronograma) {
  return (Array.isArray(contenidosCronograma) ? contenidosCronograma : []).map(
    (item) => ({
      value: item.id_contenido_cronograma,
      label: `${item.nombre_contenido} · ${item.nombre_unidad}`,
    }),
  );
}

// Nombre a mostrar del contenido asociado a un nodo (solo lectura), a
// partir del catálogo `contenidos_cronograma`. Cadena vacía si no aplica.
export function nombreContenidoCronograma(
  contenidosCronograma,
  idContenidoCronograma,
) {
  if (!idContenidoCronograma) return '';

  const item = (
    Array.isArray(contenidosCronograma) ? contenidosCronograma : []
  ).find((c) => c.id_contenido_cronograma === idContenidoCronograma);

  return item ? `${item.nombre_contenido} · ${item.nombre_unidad}` : '';
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

  if (valores.tieneEntrada) {
    Object.assign(errores, validarEntrada(valores));
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
      if (valores.entradaTipo === TIPO_ENTRADA.ESCALA) {
        if (valores.entradaPaso.trim() !== '') {
          entrada.paso = Number(valores.entradaPaso);
        }
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

export function payloadCrearNodo(valores) {
  const contenido = { texto: valores.texto };
  if (valores.tieneEntrada) contenido.entrada = construirEntrada(valores);
  if (valores.capturaPerfilDimension) {
    contenido.capturaPerfil = { dimension: valores.capturaPerfilDimension };
  }

  const payload = {
    id_tipo_nodo: valores.idTipoNodo,
    contenido,
    es_nodo_inicial: valores.esNodoInicial,
  };
  const orden = String(valores.orden).trim();

  if (orden !== '') payload.orden = Number(orden);
  if (valores.idContenidoCronograma) {
    payload.id_contenido_cronograma = valores.idContenidoCronograma;
  }

  return payload;
}

// Solo viaja lo que cambió (el backend rechaza un PATCH vacío). Devuelve
// null si no hay cambios.
export function payloadActualizarNodo(nodo, valores) {
  const cambios = {};
  const orden =
    String(valores.orden).trim() === '' ? null : Number(valores.orden);
  const idContenidoCronograma = valores.idContenidoCronograma || null;

  if (valores.idTipoNodo !== nodo.idTipoNodo)
    cambios.id_tipo_nodo = valores.idTipoNodo;

  const entradaNueva = valores.tieneEntrada ? construirEntrada(valores) : null;
  const entradaCambio =
    JSON.stringify(entradaNueva) !== JSON.stringify(nodo.entrada ?? null);
  const capturaPerfilCambio =
    valores.capturaPerfilDimension !==
    capturaPerfilDesdeContenido(nodo.contenido);

  if (valores.texto !== nodo.texto || entradaCambio || capturaPerfilCambio) {
    const contenido = { ...nodo.contenido, texto: valores.texto };
    if (entradaNueva) contenido.entrada = entradaNueva;
    else delete contenido.entrada;
    if (capturaPerfilCambio) {
      if (valores.capturaPerfilDimension) {
        contenido.capturaPerfil = { dimension: valores.capturaPerfilDimension };
      } else {
        delete contenido.capturaPerfil;
      }
    }
    cambios.contenido = contenido;
  }

  if (valores.esNodoInicial !== nodo.esNodoInicial) {
    cambios.es_nodo_inicial = valores.esNodoInicial;
  }
  if (orden !== nodo.orden) cambios.orden = orden;
  if (idContenidoCronograma !== (nodo.idContenidoCronograma ?? null)) {
    cambios.id_contenido_cronograma = idContenidoCronograma;
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
}
