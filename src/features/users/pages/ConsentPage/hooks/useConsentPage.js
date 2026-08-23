import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../../hooks/useRegistration.js';

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

export function useConsentPage({
  consentVersion,
}) {
  const navigate = useNavigate();

  const {
    account,
    saveConsent,
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

  const [
    cancelDialogOpen,
    setCancelDialogOpen,
  ] = useState(false);

  const [isCancelling, setIsCancelling] =
    useState(false);

  const consentIsComplete =
    authorizations.personalDataAccepted &&
    authorizations.consumptionHistoryAccepted;

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

  function openCancelDialog() {
    setCancelDialogOpen(true);
  }

  function closeCancelDialog() {
    if (isCancelling) {
      return;
    }

    setCancelDialogOpen(false);
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
      focusFirstMissingAuthorization(authorizations);
      return;
    }

    if (!account) {
      returnToAccountCreation();
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      saveConsent({
        personalDataAccepted:
          authorizations.personalDataAccepted,

        consumptionHistoryAccepted:
          authorizations.consumptionHistoryAccepted,

        consentVersion,
        status: 'VIGENTE',
      });

      navigate('/registro/linea-base');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelRegistration() {
    if (!account) {
      returnToAccountCreation();
      return;
    }

    setIsCancelling(true);
    setSubmitError('');

    try {
      setCancelDialogOpen(false);
      returnToAccountCreation();
    } finally {
      setIsCancelling(false);
    }
  }

  return {
    account,
    authorizations,
    attemptedSubmit,
    submitError,
    isSubmitting,
    cancelDialogOpen,
    isCancelling,
    consentIsComplete,
    handleAuthorizationChange,
    handleSubmit,
    handleCancelRegistration,
    openCancelDialog,
    closeCancelDialog,
  };
}


