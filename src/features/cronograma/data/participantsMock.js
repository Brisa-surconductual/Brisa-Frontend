import { PARTICIPANT_PROGRESS_STATUS } from '@/features/cronograma/types/participantProgressTypes.js';
import { ADMINISTRATIVE_PAUSE_STATUS } from '@/features/cronograma/types/administrativePauseTypes.js';

/** El programa son 5 unidades temporales de 7 días. */
export const DAYS_PER_WEEK = 7;
export const TOTAL_WEEKS = 5;
export const TOTAL_DAYS = DAYS_PER_WEEK * TOTAL_WEEKS;

/**
 * Progreso de los participantes.
 *
 * Nombres de campo alineados con ParticipantProgressCard, ParticipantProgressList
 * y CompletedParticipantProgress, para que el mock entre sin adaptador.
 *
 * Ojo con los dos progresos, que el prototipo muestra en pantallas distintas:
 *  - completedDays / totalDays → todo el programa (el "35/35" de s-admin-progress).
 *  - currentWeekCompletedDays  → solo la unidad en curso (el "2 / 7 días" del home).
 *
 * `pause` es null salvo que el participante esté EN_PAUSA. `resumeDate` es el
 * día siguiente al fin de la pausa.
 */
export const PARTICIPANTS = Object.freeze([
  Object.freeze({
    id: 'u1',
    initials: 'LM',
    participantName: 'Laura M.',
    email: 'estudiante@usco.edu.co',
    temporalUnitId: 'ut-2',
    temporalUnitName: 'Semana 2',
    currentWeek: 2,
    currentDay: 3,
    currentWeekCompletedDays: 2,
    completedWeeks: 1,
    totalWeeks: TOTAL_WEEKS,
    completedDays: 9,
    totalDays: TOTAL_DAYS,
    status: PARTICIPANT_PROGRESS_STATUS.ACTIVO,
    pause: null,
  }),

  Object.freeze({
    id: 'u2',
    initials: 'TR',
    participantName: 'Tatiana R.',
    email: 'tatiana@usco.edu.co',
    temporalUnitId: 'ut-2',
    temporalUnitName: 'Semana 2',
    currentWeek: 2,
    currentDay: 3,
    currentWeekCompletedDays: 2,
    completedWeeks: 1,
    totalWeeks: TOTAL_WEEKS,
    completedDays: 9,
    totalDays: TOTAL_DAYS,
    status: PARTICIPANT_PROGRESS_STATUS.EN_PAUSA,
    pause: Object.freeze({
      startDate: '2026-06-12',
      endDate: '2026-06-18',
      resumeDate: '2026-06-19',
      reason: 'Exámenes finales universitarios.',
      status: ADMINISTRATIVE_PAUSE_STATUS.ACTIVA,
    }),
  }),

  Object.freeze({
    id: 'u3',
    initials: 'CV',
    participantName: 'Carlos V.',
    email: 'carlos@usco.edu.co',
    temporalUnitId: 'ut-2',
    temporalUnitName: 'Semana 2',
    currentWeek: 2,
    currentDay: 2,
    currentWeekCompletedDays: 1,
    completedWeeks: 1,
    totalWeeks: TOTAL_WEEKS,
    completedDays: 8,
    totalDays: TOTAL_DAYS,
    status: PARTICIPANT_PROGRESS_STATUS.ACTIVO,
    pause: null,
  }),

  Object.freeze({
    id: 'u4',
    initials: 'SP',
    participantName: 'Santiago P.',
    email: 'santiago@usco.edu.co',
    temporalUnitId: 'ut-1',
    temporalUnitName: 'Semana 1',
    currentWeek: 1,
    currentDay: 5,
    currentWeekCompletedDays: 4,
    completedWeeks: 0,
    totalWeeks: TOTAL_WEEKS,
    completedDays: 4,
    totalDays: TOTAL_DAYS,
    status: PARTICIPANT_PROGRESS_STATUS.ACTIVO,
    pause: null,
  }),

  Object.freeze({
    id: 'u5',
    initials: 'AG',
    participantName: 'Andrea G.',
    email: 'andrea@usco.edu.co',
    temporalUnitId: 'ut-5',
    temporalUnitName: 'Semana 5',
    currentWeek: 5,
    currentDay: 7,
    currentWeekCompletedDays: 7,
    completedWeeks: 5,
    totalWeeks: TOTAL_WEEKS,
    completedDays: TOTAL_DAYS,
    totalDays: TOTAL_DAYS,
    status: PARTICIPANT_PROGRESS_STATUS.COMPLETADO,
    pause: null,
  }),
]);

/** Claves calcadas de ParticipantProgressSummary. */
export const PARTICIPANT_PROGRESS_SUMMARY = Object.freeze({
  totalParticipants: PARTICIPANTS.length,

  activeParticipants: PARTICIPANTS.filter(
    ({ status }) => status === PARTICIPANT_PROGRESS_STATUS.ACTIVO,
  ).length,

  pausedParticipants: PARTICIPANTS.filter(
    ({ status }) => status === PARTICIPANT_PROGRESS_STATUS.EN_PAUSA,
  ).length,
});
