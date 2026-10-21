export function contentFormReturnPath(association, isEditMode = false) {
  if (
    !isEditMode &&
    typeof association?.scheduleId === 'string' &&
    association.scheduleId &&
    typeof association?.unitId === 'string' &&
    association.unitId
  ) {
    return `/app/administrativo/cronograma/${encodeURIComponent(association.scheduleId)}/unidades/${encodeURIComponent(association.unitId)}/contenido`;
  }
  return '/app/administrativo/cronograma/contenidos';
}
