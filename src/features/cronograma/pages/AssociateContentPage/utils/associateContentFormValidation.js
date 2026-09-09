/**
 * HU-CR-02 / RF-10: no se puede confirmar la asociación sin una actividad y una
 * unidad temporal destino seleccionadas.
 *
 * HU-CR-04 / RF-12: el orden lo escribe el administrativo y debe ser un entero
 * positivo libre DENTRO de la unidad destino. La unicidad es por unidad, NO
 * global: dos unidades distintas pueden tener cada una su actividad en el orden
 * 1, como ya ocurre en el mock (ut-1 y ut-2).
 *
 * `scheduledContent` es opcional: sin él se valida solo el formato del orden.
 * La ventana de disponibilidad (RF-11) sigue derivándose de la unidad, no tiene
 * campo propio todavía.
 */
export function validateAssociateContentForm(form, scheduledContent = []) {
  const errors = {};

  const order = Number(form.order);

  if (!form.contentId) {
    errors.contentId = 'Selecciona una actividad.';
  }

  if (!form.temporalUnitId) {
    errors.temporalUnitId = 'Selecciona una unidad temporal.';
  }

  // El formato se comprueba antes que la unicidad: un "1.5" debe explicarse
  // como valor inválido, nunca como orden ocupado.
  // `?.trim()` cubre a la vez el campo ausente y el que solo trae espacios:
  // sin él, Number('  ') es 0 y el usuario vería "mayor que cero" en vez de
  // "obligatorio".
  if (!form.order?.trim()) {
    errors.order = 'El orden de la actividad es obligatorio.';
  } else if (!Number.isInteger(order) || order <= 0) {
    errors.order = 'El orden debe ser un número entero mayor que cero.';
  } else if (
    scheduledContent.some(
      (item) =>
        item.temporalUnitId === form.temporalUnitId && item.order === order,
    )
  ) {
    errors.order = `Ya hay una actividad con el orden ${order} en esta unidad.`;
  }

  return errors;
}

export function hasAssociateContentFormErrors(errors) {
  return Object.keys(errors).length > 0;
}
