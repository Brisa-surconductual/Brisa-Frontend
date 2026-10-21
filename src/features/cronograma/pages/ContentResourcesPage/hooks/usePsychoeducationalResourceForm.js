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
  id: null, // <-- Agregamos el ID para saber si estamos editando
  type: '',
  order: '',
  textContent: '',
  storageKey: '',
  file: null,
  moduleIds: Object.freeze([]),
});

function createInitialForm(initialValues = EMPTY_RESOURCE_FORM) {
  return {
    id: initialValues.id ?? null,
    type: initialValues.type ?? '',
    order:
      initialValues.order !== undefined &&
      initialValues.order !== null
        ? String(initialValues.order)
        : '',
    textContent: initialValues.textContent ?? '',
    storageKey: initialValues.storageKey ?? '',
    file: null,
    moduleIds: Array.isArray(initialValues.moduleIds)
      ? [...initialValues.moduleIds]
      : [],
  };
}

export function usePsychoeducationalResourceForm({
  initialValues = EMPTY_RESOURCE_FORM,
  resources = [], 
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

    // --- VALIDACIÓN EN TIEMPO REAL ---
    // Verificamos !form.id para asegurarnos de que es un recurso NUEVO
    if (name === 'order' && !form.id) {
      const expectedOrder = resources.length + 1;
      const numericValue = Number(value);

      if (value !== '' && numericValue !== expectedOrder) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          order: `El orden debe ser secuencial. Como ya existen ${resources.length} recursos, el bloque que corresponde es el ${expectedOrder}.`,
        }));
      } else {
        clearFieldError('order');
      }
    }
    // ---------------------------------

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

  function handleModuleToggle(moduleId) {
    setForm((currentForm) => {
      const isSelected =
        currentForm.moduleIds.includes(moduleId);

      return {
        ...currentForm,
        moduleIds: isSelected
          ? currentForm.moduleIds.filter(
              (currentModuleId) =>
                currentModuleId !== moduleId,
            )
          : [...currentForm.moduleIds, moduleId],
      };
    });

    clearFieldError('moduleIds');
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validatePsychoeducationalResourceForm(form);

    // Validación final por seguridad al guardar (solo si es nuevo)
    if (!form.id) {
      const expectedOrder = resources.length + 1;
      if (Number(form.order) !== expectedOrder) {
        validationErrors.order = `El orden debe ser secuencial. El bloque que corresponde es el ${expectedOrder}.`;
      }
    }

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
      moduleIds: [...form.moduleIds],
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
    handleModuleToggle,
    handleSubmit,
    resetForm,
  };
}