import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  saveBaselineData,
  updateRegistrationData,
} from '../../../api/registrationApi.js';

import { useRegistration } from '../../../hooks/useRegistration.js';

import {
  getModifiedFields,
  hasSensitiveChanges,
} from '../../../services/registrationReview.js';

export function useBaselineSubmission({
  onValidationError,
}) {
  const navigate = useNavigate();

  const {
    account,
    baselineSnapshot,
    isEditingFromReview,
    saveAccount,
    saveBaseline,
    saveEditedBaseline,
  } = useRegistration();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState('');

  async function submitInitialBaseline(baseline) {
    const response = await saveBaselineData({
      userId: account.userId,
      baseline,
    });

    saveBaseline(response.baseline);

    saveAccount({
      ...account,
      registrationStatus:
        response.registrationStatus,
    });
  }

  async function submitEditedBaseline(baseline) {
    const response =
      await updateRegistrationData({
        userId: account.userId,
        baseline,
      });

    const modifiedFields = getModifiedFields(
      baselineSnapshot,
      response.baseline,
    );

    const sensitiveChanges =
      hasSensitiveChanges(modifiedFields);

    saveEditedBaseline({
      baseline: response.baseline,
      modifiedFields,
      consentIsValid: !sensitiveChanges,
    });
  }

  function handleSubmissionError(error) {
    if (
      error?.code === 'INVALID_BASELINE' &&
      error.validationErrors
    ) {
      onValidationError(error.validationErrors);
      return;
    }

    if (error?.code === 'CONSENT_REQUIRED') {
      navigate('/registro/consentimiento', {
        replace: true,
      });

      return;
    }

    setSubmitError(
      'No pudimos guardar la línea base. Revisa tu conexión e intenta nuevamente.',
    );
  }

  async function submitBaseline(baseline) {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (isEditingFromReview) {
        await submitEditedBaseline(baseline);
      } else {
        await submitInitialBaseline(baseline);
      }

      navigate('/registro/revision');
    } catch (error) {
      handleSubmissionError(error);
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