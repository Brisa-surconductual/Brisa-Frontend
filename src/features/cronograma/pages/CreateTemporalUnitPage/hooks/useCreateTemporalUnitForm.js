import { useState } from 'react';

const INITIAL_FORM = Object.freeze({
  name: '',
  startDate: '',
  endDate: '',
});

export function useCreateTemporalUnitForm({ onValidSubmit } = {}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[name]) return currentErrors;
      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });

    setSubmitError('');
  }

  // Validación propia sin depender del campo viejo "orden"
  function validateForm() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!form.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria.';
    if (!form.endDate) newErrors.endDate = 'La fecha de fin es obligatoria.';
    
    // Validar coherencia de fechas
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      newErrors.endDate = 'La fecha final no puede ser anterior al inicio.';
    }
    
    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    // Ejecutar validación
    const validationErrors = validateForm();
    
    // Si hay errores, se asignan al estado y aborta (aquí moría silenciosamente antes)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; 
    }

    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      await onValidSubmit?.(form);
    } catch (error) {
      console.error('Error interno capturado por el hook:', error); 
      // Si el error tiene un mensaje (el que lanzamos arriba), lo mostramos. Si no, el default.
      setSubmitError(error.message || 'No fue posible crear la unidad temporal. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    errors,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
}