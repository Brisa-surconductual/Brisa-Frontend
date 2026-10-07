import { useState } from 'react';

import {
  hasAssociateContentFormErrors,
  validateAssociateContentForm,
} from '../utils/associateContentFormValidation.js';


export function useAssociateContentForm({
  initialTemporalUnitId = '',
  onValidSubmit,
} = {}) {
  const [form, setForm] = useState({
    contentId: '',
    temporalUnitId: initialTemporalUnitId,
    availableFrom: '',
    availableUntil: '',
  });

  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({ ...currentForm, [name]: value }));

    // Se borra el error del campo tocado. Excepción: la validez del orden
    // depende de la unidad destino (la unicidad es por unidad), así que
    // cambiar de unidad también invalida un error de orden que ya no aplica.
    setErrors((currentErrors) => {
      const staleKeys = [
        name,
        name === 'availableFrom' ? 'availableUntil' : '',
      ].filter((key) => key && currentErrors[key]);

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

    const validationErrors =
      validateAssociateContentForm(form);

    if (hasAssociateContentFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    onValidSubmit?.({
      contentId: form.contentId,
      temporalUnitId: form.temporalUnitId,
      availableFrom: form.availableFrom,
      availableUntil: form.availableUntil,
    });
  }

  /**
   * Tras asociar, la actividad ya no está disponible y el orden que se acaba de
   * usar queda ocupado: se limpian ambos para poder encadenar asociaciones
   * sobre la misma unidad sin arrastrar un valor que ya daría error. La unidad
   * destino se conserva a propósito.
   */
  function clearAssociationForm() {
    setForm((currentForm) => ({
      ...currentForm,
      contentId: '',
      availableFrom: '',
      availableUntil: '',
    }));
  }

  return { form, errors, handleChange, handleSubmit, clearAssociationForm };
}
