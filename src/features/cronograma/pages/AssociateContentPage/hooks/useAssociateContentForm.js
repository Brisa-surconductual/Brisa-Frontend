import { useState } from 'react';

import {
  hasAssociateContentFormErrors,
  validateAssociateContentForm,
} from '../utils/associateContentFormValidation.js';

/**
 * La unidad destino llega precargada desde el parámetro de ruta, pero queda
 * editable: el brief la pide como campo requerido del formulario.
 *
 * `scheduledContent` es lo ya programado, necesario para comprobar que el orden
 * (HU-CR-04 / RF-12) no esté ocupado dentro de la unidad destino.
 */
export function useAssociateContentForm({
  initialTemporalUnitId = '',
  scheduledContent = [],
  onValidSubmit,
} = {}) {
  const [form, setForm] = useState({
    contentId: '',
    temporalUnitId: initialTemporalUnitId,
    order: '',
  });

  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({ ...currentForm, [name]: value }));

    // Se borra el error del campo tocado. Excepción: la validez del orden
    // depende de la unidad destino (la unicidad es por unidad), así que
    // cambiar de unidad también invalida un error de orden que ya no aplica.
    setErrors((currentErrors) => {
      const staleKeys = [name, name === 'temporalUnitId' ? 'order' : ''].filter(
        (key) => key && currentErrors[key],
      );

      if (staleKeys.length === 0) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };

      staleKeys.forEach((key) => delete nextErrors[key]);

      return nextErrors;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateAssociateContentForm(
      form,
      scheduledContent,
    );

    if (hasAssociateContentFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    onValidSubmit?.({
      contentId: form.contentId,
      temporalUnitId: form.temporalUnitId,
      // El input guarda texto; la página recibe ya el número que va al estado.
      order: Number(form.order),
    });
  }

  /**
   * Tras asociar, la actividad ya no está disponible y el orden que se acaba de
   * usar queda ocupado: se limpian ambos para poder encadenar asociaciones
   * sobre la misma unidad sin arrastrar un valor que ya daría error. La unidad
   * destino se conserva a propósito.
   */
  function clearContentAndOrder() {
    setForm((currentForm) => ({
      ...currentForm,
      contentId: '',
      order: '',
    }));
  }

  return { form, errors, handleChange, handleSubmit, clearContentAndOrder };
}
