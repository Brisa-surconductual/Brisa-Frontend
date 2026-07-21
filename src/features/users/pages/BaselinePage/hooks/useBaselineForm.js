import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { getCurrentDateInBogota } from '../../../../../shared/utils/dateUtils.js';

import { useRegistration } from '../../../hooks/useRegistration.js';
import { validateBaselineForm } from '../../../services/baselineValidation.js';

import {
  createBaselineFormState,
  normalizeBaselineForm,
} from '../utils/baselineForm.js';

import {
  clearFieldErrors,
  focusFirstInvalidField,
  hasValidationErrors,
} from '../utils/baselineFormUtils.js';

import { useBaselineSubmission } from './useBaselineSubmission.js';

export function useBaselineForm() {
  const navigate = useNavigate();

  const {
    account,
    consent,
    baseline,
    isEditingFromReview,
    reviewEditSection,
    cancelReviewEdit,
  } = useRegistration();

  const [form, setForm] = useState(() =>
    createBaselineFormState(baseline),
  );

  const [errors, setErrors] = useState({});

  const currentDate = getCurrentDateInBogota();

  function showValidationErrors(
    validationErrors,
  ) {
    setErrors(validationErrors);
    focusFirstInvalidField(validationErrors);
  }

  const {
    isSubmitting,
    submitError,
    clearSubmitError,
    submitBaseline,
  } = useBaselineSubmission({
    onValidationError:
      showValidationErrors,
  });

  useEffect(() => {
    if (
      !isEditingFromReview ||
      !reviewEditSection
    ) {
      return undefined;
    }

    const sectionId =
      reviewEditSection === 'academic'
        ? 'academic-section'
        : 'consumption-section';

    const animationFrameId =
      requestAnimationFrame(() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
      });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isEditingFromReview,
    reviewEditSection,
  ]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) =>
      clearFieldErrors(
        currentErrors,
        name,
      ),
    );

    clearSubmitError();
  }

  function handleBack() {
    if (isEditingFromReview) {
      cancelReviewEdit();
      navigate('/registro/revision');
      return;
    }

    navigate('/registro/consentimiento');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validateBaselineForm(form);

    if (
      hasValidationErrors(validationErrors)
    ) {
      showValidationErrors(validationErrors);
      return;
    }

    await submitBaseline(
      normalizeBaselineForm(form),
    );
  }

  return {
    account,
    consent,
    form,
    errors,
    submitError,
    isSubmitting,
    isEditingFromReview,
    currentDate,
    handleBack,
    handleChange,
    handleSubmit,
  };
}