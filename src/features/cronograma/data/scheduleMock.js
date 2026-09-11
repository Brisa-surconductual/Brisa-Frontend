import { TEMPORAL_UNIT_STATUS } from '@/features/cronograma/types/scheduleTypes.js';
import { SCHEDULED_CONTENT_STATUS } from '@/features/cronograma/types/contentTypes.js';

/**
 * Contenido del catálogo ya programado dentro de una unidad temporal.
 *
 * `order` es solo la posición dentro de la secuencia de la unidad, nunca un
 * número de día (decisión del equipo, FIX-M04-01). La UI lo pinta como "#3".
 *
 * La ventana de disponibilidad hereda hoy el rango completo de su unidad, no un
 * día concreto. Sin hora: solo fecha, confirmado por el equipo, igual que el
 * prototipo (`availDate` e `<input type="date">`).
 *
 * ut-4 y ut-5 quedan a propósito sin contenido, para ejercitar el estado vacío.
 */
export const SCHEDULED_CONTENT = Object.freeze([
  Object.freeze({
    id: 'sc-ut1-1',
    temporalUnitId: 'ut-1',
    contentId: 'c-s1d1',
    order: 1,
    availableFrom: '2026-06-02',
    availableUntil: '2026-06-08',
    status: SCHEDULED_CONTENT_STATUS.COMPLETADO,
  }),

  Object.freeze({
    id: 'sc-ut2-1',
    temporalUnitId: 'ut-2',
    contentId: 'c-s2d1',
    order: 1,
    availableFrom: '2026-06-09',
    availableUntil: '2026-06-15',
    status: SCHEDULED_CONTENT_STATUS.COMPLETADO,
  }),

  Object.freeze({
    id: 'sc-ut2-2',
    temporalUnitId: 'ut-2',
    contentId: 'c-s2d2',
    order: 2,
    availableFrom: '2026-06-10',
    availableUntil: '2026-06-15',
    status: SCHEDULED_CONTENT_STATUS.COMPLETADO,
  }),

  Object.freeze({
    id: 'sc-ut2-3',
    temporalUnitId: 'ut-2',
    contentId: 'c-s2d3',
    order: 3,
    availableFrom: '2026-06-11',
    availableUntil: '2026-06-15',
    status: SCHEDULED_CONTENT_STATUS.ACTIVO,
  }),

  Object.freeze({
    id: 'sc-ut2-4',
    temporalUnitId: 'ut-2',
    contentId: 'c-s2d4',
    order: 4,
    availableFrom: '2026-06-12',
    availableUntil: '2026-06-15',
    status: SCHEDULED_CONTENT_STATUS.PROGRAMADO,
  }),

  Object.freeze({
    id: 'sc-ut3-1',
    temporalUnitId: 'ut-3',
    contentId: 'c-s3d1',
    order: 1,
    availableFrom: '2026-06-16',
    availableUntil: '2026-06-22',
    status: SCHEDULED_CONTENT_STATUS.PROGRAMADO,
  }),
]);

function countScheduledContent(temporalUnitId) {
  return SCHEDULED_CONTENT.filter(
    (content) => content.temporalUnitId === temporalUnitId,
  ).length;
}

/**
 * Unidades temporales del cronograma.
 *
 * Los nombres de campo son los que ya consumen TemporalUnitList/TemporalUnitCard,
 * así que el mock es drop-in en las pantallas existentes.
 *
 * Fechas en ISO date-only (YYYY-MM-DD): es el único formato que acepta
 * parseDateOnly(), del que dependen formatScheduleDate/formatScheduleDateRange.
 *
 * activityCount se deriva de SCHEDULED_CONTENT en vez de escribirse a mano,
 * para que no puedan divergir. Son menos de 7 por semana porque este mock es
 * un subconjunto del programa, no las 35 actividades completas.
 */
export const TEMPORAL_UNITS = Object.freeze(
  [
    {
      id: 'ut-1',
      weekNumber: 1,
      name: 'Semana 1',
      theme: 'Flexibilidad cognitiva',
      status: TEMPORAL_UNIT_STATUS.COMPLETADA,
      startDate: '2026-06-02',
      endDate: '2026-06-08',
    },

    {
      id: 'ut-2',
      weekNumber: 2,
      name: 'Semana 2',
      theme: 'Evaluación emocional',
      status: TEMPORAL_UNIT_STATUS.ACTIVA,
      startDate: '2026-06-09',
      endDate: '2026-06-15',
    },

    {
      id: 'ut-3',
      weekNumber: 3,
      name: 'Semana 3',
      theme: 'Conciencia emocional',
      status: TEMPORAL_UNIT_STATUS.BLOQUEADA,
      startDate: '2026-06-16',
      endDate: '2026-06-22',
    },

    // El prototipo la marca BLOQUEADA y luego la pinta "POR DEFINIR" con un
    // caso especial (w.id === 4). El repo ya tiene el estado correcto.
    {
      id: 'ut-4',
      weekNumber: 4,
      name: 'Semana 4',
      theme: 'Contenido por definir',
      status: TEMPORAL_UNIT_STATUS.POR_DEFINIR,
      startDate: '2026-06-23',
      endDate: '2026-06-29',
    },

    {
      id: 'ut-5',
      weekNumber: 5,
      name: 'Semana 5',
      theme: 'Exposición a desencadenantes',
      status: TEMPORAL_UNIT_STATUS.BLOQUEADA,
      startDate: '2026-06-30',
      endDate: '2026-07-06',
    },
  ].map((unit) =>
    Object.freeze({
      ...unit,
      activityCount: countScheduledContent(unit.id),
    }),
  ),
);
