import { CONTENT_TYPE } from '@/features/cronograma/types/contentTypes.js';

/**
 * Catálogo de contenido disponible para asociar a una unidad temporal.
 *
 * assignedTemporalUnitId === null ⇒ el contenido está libre y puede asociarse.
 * No hay un booleano `isAssigned` aparte: se deriva de este campo, para no
 * mantener dos fuentes de verdad que se puedan desincronizar.
 *
 * Datos tomados de docs/M04_prototipo_v1.2.html (CONTENT_CATALOG y WEEKS).
 * Es un subconjunto representativo, no las 35 actividades del programa.
 */
export const CONTENT_CATALOG = Object.freeze([
  Object.freeze({
    id: 'c-s1d1',
    title: 'Balance decisional',
    type: CONTENT_TYPE.ACTIVIDAD,
    interactionType: 'Arrastre a 2 columnas (pros/contras)',
    description: 'Clasifica 8 frases en pros y contras del vapeo, una a una.',
    indicator: 'IEA — Índice de evitación afectiva',
    assignedTemporalUnitId: 'ut-1',
  }),

  Object.freeze({
    id: 'c-s2d1',
    title: '¿Qué hago cuando me siento mal?',
    type: CONTENT_TYPE.ACTIVIDAD,
    interactionType: 'Tarjetas situacionales · 5 opciones de respuesta',
    description: 'Seis situaciones emocionalmente relevantes, una a la vez.',
    indicator: 'IEI — Índice de evitación inicial',
    assignedTemporalUnitId: 'ut-2',
  }),

  Object.freeze({
    id: 'c-s2d2',
    title: 'El alivio que dura poco',
    type: CONTENT_TYPE.EVALUACION,
    interactionType: 'Sliders comparativos: alivio inmediato vs 1h',
    description:
      'Valoras el alivio inmediato y el alivio una hora después del vapeo.',
    indicator: 'IAT — Índice de alivio transitorio',
    assignedTemporalUnitId: 'ut-2',
  }),

  Object.freeze({
    id: 'c-s2d3',
    title: '¿Qué evito cuando vapeo?',
    type: CONTENT_TYPE.ACTIVIDAD,
    interactionType: 'Clasificación de 8 tarjetas en 4 categorías',
    description: 'Arrastra 8 tarjetas a 4 categorías de evitación.',
    indicator: 'PE — Perfil de evitación',
    assignedTemporalUnitId: 'ut-2',
  }),

  Object.freeze({
    id: 'c-s2d4',
    title: 'El costo de evitar',
    type: CONTENT_TYPE.REFLEXION,
    interactionType: 'Selección múltiple + campo de texto libre',
    description:
      'Seleccionas qué consecuencias de la evitación te han ocurrido.',
    indicator: 'ICC — Índice de conciencia de costos',
    assignedTemporalUnitId: 'ut-2',
  }),

  Object.freeze({
    id: 'c-s3d1',
    title: 'Detente y observa',
    type: CONTENT_TYPE.ACTIVIDAD,
    interactionType: 'Grid de 6 emociones + slider + silueta corporal',
    description: 'Seleccionas cómo te sientes y mides tu impulso de vapear.',
    indicator: 'IEI — Índice emoción-impulso',
    assignedTemporalUnitId: 'ut-3',
  }),

  Object.freeze({
    id: 'c-new1',
    title: 'Técnicas de relajación muscular progresiva',
    type: CONTENT_TYPE.EJERCICIO,
    interactionType: 'Temporizador guiado + instrucciones',
    description: 'Ejercicio de 10 minutos para reducir la tensión corporal.',
    indicator: 'IRM — Índice de relajación muscular',
    assignedTemporalUnitId: null,
  }),

  Object.freeze({
    id: 'c-new2',
    title: 'Mi red de apoyo social',
    type: CONTENT_TYPE.REFLEXION,
    interactionType: 'Mapa visual + texto libre',
    description: 'Identifica las personas de tu entorno que pueden apoyarte.',
    indicator: 'IARS — Índice de apoyo social percibido',
    assignedTemporalUnitId: null,
  }),

  Object.freeze({
    id: 'c-new3',
    title: 'Carta a mi yo futuro',
    type: CONTENT_TYPE.REFLEXION,
    interactionType: 'Texto libre asistido (mín. 100 palabras)',
    description:
      'Escribe una carta desde el yo del futuro con 6 meses sin vapear.',
    indicator: 'IOM — Índice de orientación motivacional',
    assignedTemporalUnitId: null,
  }),

  Object.freeze({
    id: 'c-new4',
    title: 'Psicoeducación sobre la nicotina',
    type: CONTENT_TYPE.PSICOEDUCACION,
    interactionType: 'Infografía interactiva + preguntas',
    description:
      'Cómo la nicotina afecta el cerebro, adaptada para universitarios.',
    indicator: 'ICCN — Índice de conocimiento sobre la nicotina',
    assignedTemporalUnitId: null,
  }),
]);
