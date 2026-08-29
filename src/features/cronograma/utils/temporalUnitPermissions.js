import { TEMPORAL_UNIT_STATUS } from '@/features/cronograma/types/scheduleTypes.js';

const EDITABLE_TEMPORAL_UNIT_STATUS = new Set([
  TEMPORAL_UNIT_STATUS.BLOQUEADA,
  TEMPORAL_UNIT_STATUS.POR_DEFINIR,
]);

export function canModifyTemporalUnit(status) {
  return EDITABLE_TEMPORAL_UNIT_STATUS.has(status);
}
