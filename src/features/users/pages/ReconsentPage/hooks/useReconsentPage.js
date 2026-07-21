import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  renewRegistrationConsent,
} from '../../../api/registrationApi.js';

import {
  useRegistration,
} from '../../../hooks/useRegistration.js';

import {
  getModifiedFieldLabels,
  getSensitiveModifiedFields,
} from '../../../services/registrationReview.js';

import {
  CONSENT_STATUS,
} from '../../../types/registrationStatus.js';

const INITIAL_AUTHORIZATIONS = Object.freeze({
  personalDataAccepted: false,
  consumptionHistoryAccepted: false,
});

function focusFirstMissingAuthorization(
  authorizations,
) {
  const firstMissingField =
    !authorizations.personalDataAccepted
      ? 'personalDataAccepted'
      : 'consumptionHistoryAccepted';

  requestAnimationFrame(() => {
    document
      .getElementById(firstMissingField)
      ?.focus();
  });
}

export function useReconsentPage({
  consentVersion,
}) {
  const navigate = useNavigate();

  const {
    account,
    consent,
    baseline,
    modifiedFields = [],
    renewConsent,
    resetRegistration,
  } = useRegistration();

  const [authorizations, setAuthorizations] =
    useState({
      ...INITIAL_AUTHORIZATIONS,
    });

  const [attemptedSubmit, setAttemptedSubmit] =
    useState(false);

  const [submitError, setSubmitError] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const sensitiveModifiedFields =
    getSensitiveModifiedFields(modifiedFields);

  const sensitiveFieldLabels =
    getModifiedFieldLabels(
      sensitiveModifiedFields,
    );

  const consentIsComplete =
    authorizations.personalDataAccepted &&
    authorizations.consumptionHistoryAccepted;

  const shouldRedirectToReview =
    consent?.status === CONSENT_STATUS.VALID ||
    sensitiveModifiedFields.length === 0;

  function handleAuthorizationChange(event) {
    const { name, checked } = event.target;

    setAuthorizations(
      (currentAuthorizations) => ({
        ...currentAuthorizations,
        [name]: checked,
      }),
    );

    setSubmitError('');
  }

  function handleBack() {
    navigate('/registro/revision');
  }

  function returnToAccountCreation() {
    resetRegistration();

    navigate('/registro/cuenta', {
      replace: true,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setAttemptedSubmit(true);

    if (!consentIsComplete) {
      focusFirstMissingAuthorization(
        authorizations,
      );

      return;
    }

    if (!account) {
      returnToAccountCreation();
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const renewedConsent =
        await renewRegistrationConsent({
          userId: account.userId,

          personalDataAccepted:
            authorizations
              .personalDataAccepted,

          consumptionHistoryAccepted:
            authorizations
              .consumptionHistoryAccepted,

          consentVersion,
        });

      renewConsent(renewedConsent);

      navigate('/registro/revision', {
        replace: true,

        state: {
          consentRenewed: true,
        },
      });
    } catch (error) {
      if (
        error?.code ===
        'PROVISIONAL_ACCOUNT_NOT_FOUND'
      ) {
        returnToAccountCreation();
        return;
      }

      if (error?.code === 'CONSENT_REQUIRED') {
        setAttemptedSubmit(true);

        focusFirstMissingAuthorization(
          authorizations,
        );

        return;
      }

      setSubmitError(
        'No pudimos actualizar el consentimiento. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    account,
    consent,
    baseline,
    authorizations,
    attemptedSubmit,
    submitError,
    isSubmitting,
    sensitiveFieldLabels,
    consentIsComplete,
    shouldRedirectToReview,
    handleAuthorizationChange,
    handleBack,
    handleSubmit,
  };
}