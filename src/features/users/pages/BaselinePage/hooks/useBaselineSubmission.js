import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../../hooks/useRegistration.js';
import { getModifiedFields, hasSensitiveChanges} from '../../../services/registrationReview.js';

export function useBaselineSubmission() {
  const navigate = useNavigate();

  const {
    baselineSnapshot,
    isEditingFromReview,
    saveBaseline,
    saveEditedBaseline,
  } = useRegistration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function submitInitialBaseline(baseline) {
    saveBaseline(baseline);
  }

  function submitEditedBaseline(baseline) {
    const modifiedFields = getModifiedFields(baselineSnapshot, baseline);
    const sensitiveChanges = hasSensitiveChanges(modifiedFields);

    saveEditedBaseline({
      baseline,
      modifiedFields,
      consentIsValid: !sensitiveChanges,
    });
  }

  async function submitBaseline(baseline) {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (isEditingFromReview) {
        submitEditedBaseline(baseline);
      } else {
        submitInitialBaseline(baseline);
      }

      navigate('/registro/revision');
    } catch (error) {
      setSubmitError('No pudimos guardar la línea base. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isSubmitting,
    submitError,
    clearSubmitError: () => setSubmitError(''),
    submitBaseline,
  };
}