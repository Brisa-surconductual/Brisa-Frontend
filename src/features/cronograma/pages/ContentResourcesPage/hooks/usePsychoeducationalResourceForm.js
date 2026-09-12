import { useState } from 'react';

import {
  PSYCHOEDUCATIONAL_RESOURCE_TYPE,
  isPsychoeducationalFileResourceType,
} from '@/features/cronograma/types/resourceTypes.js';

import {
  hasPsychoeducationalResourceFormErrors,
  validatePsychoeducationalResourceForm,
} from '@/features/cronograma/utils/psychoeducationalResourceFormValidation.js';

const EMPTY_RESOURCE_FORM = Object.freeze({
  type: '',
  order: '',
  textContent: '',
  storageKey: '',
  file: null,
});

function createInitialForm(initialValues = EMPTY_RESOURCE_FORM) {
  return {
    type: initialValues.type ?? '',
    order:
      initialValues.order !== undefined &&
      initialValues.order !== null
        ? String(initialValues.order)
        : '',
    textContent: initialValues.textContent ?? '',
    storageKey: initialValues.storageKey ?? '',
    file: null,
  };
}

export function usePsychoeducationalResourceForm({
  initialValues = EMPTY_RESOURCE_FORM,
  onValidSubmit,
} = {}) {
  const [form, setForm] = useState(() =>
    createInitialForm(initialValues),
  );

  const [errors, setErrors] = useState({});

  function clearFieldError(fieldName) {
    setErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = {
        ...currentErrors,
      };

      delete nextErrors[fieldName];

      return nextErrors;
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [name]: value,
      };

      if (name === 'type') {
        if (
          value ===
          PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO
        ) {
          nextForm.file = null;
          nextForm.storageKey = '';
        } else {
          nextForm.textContent = '';

          if (currentForm.type !== value) {
            nextForm.file = null;
            nextForm.storageKey = '';
          }
        }
      }

      return nextForm;
    });

    clearFieldError(name);

    if (name === 'type') {
      clearFieldError('textContent');
      clearFieldError('file');
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;

    setForm((currentForm) => ({
      ...currentForm,
      file,
    }));

    clearFieldError('file');
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validatePsychoeducationalResourceForm(form);

    setErrors(validationErrors);

    if (
      hasPsychoeducationalResourceFormErrors(
        validationErrors,
      )
    ) {
      return;
    }

    const isFileResource =
      isPsychoeducationalFileResourceType(form.type);

    onValidSubmit?.({
      type: form.type,
      order: Number(form.order),
      textContent:
        form.type ===
        PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO
          ? form.textContent.trim()
          : null,
      file: isFileResource ? form.file : null,
      storageKey: isFileResource
        ? form.storageKey.trim() || null
        : null,
    });
  }

  function resetForm(values = EMPTY_RESOURCE_FORM) {
    setForm(createInitialForm(values));
    setErrors({});
  }

  return {
    form,
    errors,
    handleChange,
    handleFileChange,
    handleSubmit,
    resetForm,
  };
}