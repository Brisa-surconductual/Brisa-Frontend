import { COHORT_STATUS } from '../types/cohortStatus.js';

/*
 * DATOS FICTICIOS DE DEMOSTRACIÓN (solo desarrollo, VITE_M08_DEMO).
 * No son contratos del backend ni información real.
 *
 * Forma interna de una cohorte en el frontend, a partir de RF-124:
 *   id         ← id_cohorte
 *   name       ← nombre_cohorte
 *   startDate  ← fecha_inicio_programa (YYYY-MM-DD)
 *   endDate    ← fecha_fin_programa    (YYYY-MM-DD)
 *   status     ← estado_cohorte (BORRADOR | ACTIVA | INACTIVA)
 *   scheduleId ← id_cronograma
 *
 * PENDIENTE de contrato: `scheduleName` no está definido en RF-124;
 * se incluye solo para la demostración y la interfaz lo trata como
 * opcional.
 */
export const DEMO_COHORTS = Object.freeze([
  Object.freeze({
    id: 'demo-cohorte-a',
    name: 'Cohorte Piloto A',
    startDate: '2026-02-02',
    endDate: '2026-05-29',
    status: COHORT_STATUS.DRAFT,
    scheduleId: 'demo-cronograma-1',
    scheduleName: 'Cronograma demostrativo 1',
  }),
  Object.freeze({
    id: 'demo-cohorte-b',
    name: 'Cohorte Piloto B',
    startDate: '2026-03-02',
    endDate: '2026-06-26',
    status: COHORT_STATUS.ACTIVE,
    scheduleId: 'demo-cronograma-1',
    scheduleName: 'Cronograma demostrativo 1',
  }),
  Object.freeze({
    id: 'demo-cohorte-c',
    name: 'Cohorte Piloto C',
    startDate: '2025-08-04',
    endDate: '2025-11-28',
    status: COHORT_STATUS.INACTIVE,
    scheduleId: 'demo-cronograma-2',
  }),
]);
