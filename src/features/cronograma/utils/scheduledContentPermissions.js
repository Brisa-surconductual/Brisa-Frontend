import { SCHEDULED_CONTENT_STATUS } from '@/features/cronograma/types/contentTypes.js';

/**
 * HU-CR-05 / HU-CR-10: solo el contenido PROGRAMADO se puede reprogramar o
 * desasociar. Lo ACTIVO y lo COMPLETADO es de solo lectura.
 *
 * Ojo: no basta con el estado del contenido, también cuenta el de su unidad.
 * Una unidad ACTIVA o COMPLETADA no admite cambios aunque el contenido esté
 * PROGRAMADO; BLOQUEADA y POR_DEFINIR sí los admiten. Esa condición es de
 * unidad, no de contenido: las pantallas la combinan con
 * canModifyTemporalUnit().
 */
export function canModifyScheduledContent(status) {
  return status === SCHEDULED_CONTENT_STATUS.PROGRAMADO;
}
