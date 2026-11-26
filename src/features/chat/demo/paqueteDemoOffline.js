/*
 * Paquete ficticio de la demostración sin conexión (solo desarrollo).
 * Sigue la forma del contrato 5a y solo usa reglas con semántica
 * definida (ENTERO, ENTRE, SIEMPRE), salvo los nodos que demuestran los
 * bloqueos. Ningún texto proviene del programa real.
 *
 * Recorridos:
 * - bienvenida → escala 1-6 → respiración → número 0-14 → cierre (completa).
 * - escala 7-10 → nodo con validación TEXTO: regla no soportada.
 * - número 15-20 → destino que no está en el paquete: falta contenido.
 */
export const ID_RECURSO_DEMO_GUARDADO = 'demo-recurso-guardado';
export const ID_RECURSO_DEMO_AUSENTE = 'demo-recurso-ausente';

const texto = (orden, contenido) => ({
  orden,
  tipo: 'TEXTO',
  texto: contenido,
});

const SIEMPRE = (destino, orden = 1) => ({
  orden_evaluacion: orden,
  operador: 'SIEMPRE',
  valor_condicion: null,
  id_nodo_destino: destino,
});

export const NODOS_DEMO_OFFLINE = Object.freeze([
  {
    id_nodo: 'demo-nodo-bienvenida',
    tipo_nodo: 'MENSAJE',
    orden: 1,
    es_nodo_inicial: true,
    es_terminal: false,
    bloques: [
      texto(
        1,
        '[Demostración] Hola. Esta conversación es ficticia y funciona con el contenido guardado en el dispositivo.',
      ),
      { orden: 2, tipo: 'RECURSO', id_recurso: ID_RECURSO_DEMO_GUARDADO },
      { orden: 3, tipo: 'RECURSO', id_recurso: ID_RECURSO_DEMO_AUSENTE },
    ],
    entrada: null,
    validacion: null,
    transiciones: [SIEMPRE('demo-nodo-escala')],
  },
  {
    id_nodo: 'demo-nodo-escala',
    tipo_nodo: 'PREGUNTA',
    orden: 2,
    es_nodo_inicial: false,
    es_terminal: false,
    bloques: [
      texto(
        1,
        '[Demostración] Del 1 al 10, ¿cuánta energía tienes en este momento?',
      ),
    ],
    entrada: {
      tipo: 'ESCALA',
      obligatorio: true,
      min: 1,
      max: 10,
      paso: 1,
      etiquetas: { min: 'Nada', max: 'Mucha' },
    },
    validacion: {
      tipo_dato: 'ENTERO',
      obligatorio: true,
      valor_min: 1,
      valor_max: 10,
      formato_regex: null,
      valores_permitidos: null,
      mensaje_error: 'Elige un valor entre 1 y 10.',
    },
    transiciones: [
      {
        orden_evaluacion: 1,
        operador: 'ENTRE',
        valor_condicion: [7, 10],
        id_nodo_destino: 'demo-nodo-no-soportado',
      },
      SIEMPRE('demo-nodo-respiracion', 2),
    ],
  },
  {
    id_nodo: 'demo-nodo-respiracion',
    tipo_nodo: 'MENSAJE',
    orden: 3,
    es_nodo_inicial: false,
    es_terminal: false,
    bloques: [
      texto(1, '[Demostración] Toma una respiración lenta antes de seguir.'),
    ],
    entrada: null,
    validacion: null,
    transiciones: [SIEMPRE('demo-nodo-numero')],
  },
  {
    id_nodo: 'demo-nodo-numero',
    tipo_nodo: 'PREGUNTA',
    orden: 4,
    es_nodo_inicial: false,
    es_terminal: false,
    bloques: [
      texto(1, '[Demostración] Escribe un número entero entre 0 y 20.'),
    ],
    entrada: { tipo: 'NUMERICO', obligatorio: true, min: 0, max: 20, paso: 1 },
    validacion: {
      tipo_dato: 'ENTERO',
      obligatorio: true,
      valor_min: 0,
      valor_max: 20,
      formato_regex: null,
      valores_permitidos: null,
      mensaje_error: 'El valor ingresado está fuera del rango permitido.',
    },
    transiciones: [
      {
        orden_evaluacion: 1,
        operador: 'ENTRE',
        valor_condicion: [15, 20],
        id_nodo_destino: 'demo-nodo-no-descargado',
      },
      SIEMPRE('demo-nodo-cierre', 2),
    ],
  },
  {
    id_nodo: 'demo-nodo-no-soportado',
    tipo_nodo: 'PREGUNTA',
    orden: 5,
    es_nodo_inicial: false,
    es_terminal: false,
    bloques: [
      texto(1, '[Demostración] Cuéntanos con tus palabras cómo te sientes.'),
    ],
    entrada: { tipo: 'TEXTO_LIBRE', obligatorio: true, maxCaracteres: 200 },
    validacion: {
      tipo_dato: 'TEXTO',
      obligatorio: true,
      valor_min: null,
      valor_max: null,
      formato_regex: null,
      valores_permitidos: null,
      mensaje_error: 'Escribe una respuesta.',
    },
    transiciones: [SIEMPRE('demo-nodo-cierre')],
  },
  {
    id_nodo: 'demo-nodo-cierre',
    tipo_nodo: 'MENSAJE',
    orden: 6,
    es_nodo_inicial: false,
    es_terminal: true,
    bloques: [texto(1, '[Demostración] Fin de la conversación de prueba.')],
    entrada: null,
    validacion: null,
    transiciones: [],
  },
]);

export const PAQUETE_DEMO_OFFLINE = Object.freeze({
  id_flujo_conversacional: 'demo-flujo-offline',
  version_arbol: 1,
  etag: 'demo-flujo-offline:v1:demo-unidad',
  nodos: NODOS_DEMO_OFFLINE,
  estado_precarga: 'PARCIAL',
});

export const ID_NODO_INICIAL_DEMO = 'demo-nodo-bienvenida';
