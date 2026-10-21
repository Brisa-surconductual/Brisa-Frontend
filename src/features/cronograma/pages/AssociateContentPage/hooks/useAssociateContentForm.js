import { useRef, useState } from 'react';

import {
  hasAssociateContentFormErrors,
  validateAssociateContentForm,
} from '../utils/associateContentFormValidation.js';

export function useAssociateContentForm({ onValidSubmit, unit } = {}) {
  const [form, setForm] = useState({
    contentId: '',
    availableFrom: '',
    availableUntil: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pending = useRef(false);

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

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending.current) return;

    const validationErrors = validateAssociateContentForm(form, unit);

    if (hasAssociateContentFormErrors(validationErrors)) {
      setErrors(validationErrors);
      const field = event.currentTarget?.elements?.namedItem(
        Object.keys(validationErrors)[0],
      );
      field?.focus();
      return;
    }

    setErrors({});

    pending.current = true;
    setIsSubmitting(true);
    try {
      await onValidSubmit?.({
        contentId: form.contentId,
        availableFrom: form.availableFrom,
        availableUntil: form.availableUntil,
      });
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  /**
   * Tras asociar, el contenido deja de estar disponible.
   * Se limpian el contenido y las fechas para permitir una nueva asociación
   * sobre la misma unidad temporal seleccionada en la URL.
   */
  function clearAssociationForm() {
    setForm((currentForm) => ({
      ...currentForm,
      contentId: '',
      availableFrom: '',
      availableUntil: '',
    }));
  }

  return {
    form,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    clearAssociationForm,
  };
}
