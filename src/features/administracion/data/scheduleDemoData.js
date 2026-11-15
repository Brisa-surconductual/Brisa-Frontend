import { SCHEDULE_STATUS } from '../types/scheduleStatus.js';

/*
 * DATOS FICTICIOS DE DEMOSTRACIÓN (solo desarrollo, VITE_M08_DEMO).
 * Catálogo de cronogramas para elegir el de una cohorte. No es el
 * DTO del backend: la forma interna es { id, name, status }.
 */
export const DEMO_SCHEDULES = Object.freeze([
  Object.freeze({
    id: 'demo-cronograma-1',
    name: 'Cronograma demostrativo 1',
    status: SCHEDULE_STATUS.ACTIVE,
  }),
  Object.freeze({
    id: 'demo-cronograma-2',
    name: 'Cronograma demostrativo 2',
    status: SCHEDULE_STATUS.INACTIVE,
  }),
  Object.freeze({
    id: 'demo-cronograma-3',
    name: 'Cronograma demostrativo 3',
    status: SCHEDULE_STATUS.ACTIVE,
  }),
]);
