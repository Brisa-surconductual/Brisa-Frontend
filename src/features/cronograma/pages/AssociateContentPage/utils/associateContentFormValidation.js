/**
 * HU-CR-02 / RF-10: no se puede confirmar la asociación sin una actividad y una
 * unidad temporal destino seleccionadas.
 *
 * El orden dentro del cronograma (RF-12) y la ventana de disponibilidad (RF-11)
 * no se validan aquí: no tienen campo propio todavía, se derivan de la unidad.
 */
export function validateAssociateContentForm(form) {
  const errors = {};

  if (!form.contentId) {
    errors.contentId = 'Selecciona una actividad.';
  }

  if (!form.temporalUnitId) {
    errors.temporalUnitId = 'Selecciona una unidad temporal.';
  }

  return errors;
}

export function hasAssociateContentFormErrors(errors) {
  return Object.keys(errors).length > 0;
}
