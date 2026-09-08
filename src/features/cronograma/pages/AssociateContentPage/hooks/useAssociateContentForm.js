import { useState } from 'react';

import {
  hasAssociateContentFormErrors,
  validateAssociateContentForm,
} from '../utils/associateContentFormValidation.js';

/**
 * La unidad destino llega precargada desde el parámetro de ruta, pero queda
 * editable: el brief la pide como campo requerido del formulario.
 */
export function useAssociateContentForm({
  initialTemporalUnitId = '',
  onValidSubmit,
} = {}) {
  const [form, setForm] = useState({
    contentId: '',
    temporalUnitId: initialTemporalUnitId,
  });

  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = {
        ...currentErrors,
      };

      delete nextErrors[name];

      return nextErrors;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateAssociateContentForm(form);

    if (hasAssociateContentFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    onValidSubmit?.({
      contentId: form.contentId,
      temporalUnitId: form.temporalUnitId,
    });
  }

  /**
   * Tras asociar, la actividad ya no está disponible: se limpia solo ese campo
   * para poder encadenar varias asociaciones sobre la misma unidad.
   */
  function clearSelectedContent() {
    setForm((currentForm) => ({
      ...currentForm,
      contentId: '',
    }));
  }

  return { form, errors, handleChange, handleSubmit, clearSelectedContent };
}
