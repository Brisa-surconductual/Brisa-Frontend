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

    // Se borra solo el error del campo tocado: los demás siguen siendo válidos
    // hasta el próximo envío.
    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };

      delete nextErrors[name];

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
