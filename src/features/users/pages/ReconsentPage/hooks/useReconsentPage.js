import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';
import { obtenerConsentimiento } from '../../../api/obtenerConsetimiento.jsx';
import { renovarConsentimientoRegistro } from '../../../api/validacionConsetimeinto.jsx';

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

export function useReconsentPage() {
  const navigate = useNavigate();
  const { user, idUsuario } = useAuth();
  const submitting = useRef(false);

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
  const [consentData, setConsentData] = useState(null);
  const [isLoadingConsent, setIsLoadingConsent] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadConsent() {
      setIsLoadingConsent(true);
      setLoadError('');
      setConsentData(null);

      try {
        const data = await obtenerConsentimiento();
        if (
          !data?.vigente ||
          !data.idConsentimeinto ||
          !data.versionConsetimeinto ||
          !data.urlContenido
        ) {
          throw new Error('El documento de consentimiento no está disponible.');
        }
        if (isMounted) setConsentData(data);
      } catch {
        if (isMounted) {
          setLoadError('No pudimos cargar el consentimiento vigente. Intenta nuevamente.');
        }
      } finally {
        if (isMounted) setIsLoadingConsent(false);
      }
    }

    void loadConsent();
    return () => { isMounted = false; };
  }, [loadAttempt]);

  function retryLoadConsent() {
    setLoadAttempt((attempt) => attempt + 1);
  }

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

    if (submitting.current || isLoadingConsent || !consentData || loadError) return;

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

    submitting.current = true;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const existingUserId = account.userId ?? idUsuario;
      if (user && !existingUserId) {
        throw new Error('No pudimos identificar tu sesión. Vuelve a iniciar sesión.');
      }

      const renewedConsent =
        await renovarConsentimientoRegistro({
          idUsuario: existingUserId,
          consentimiento: consentData,

          personalDataAccepted:
            authorizations
              .personalDataAccepted,

          consumptionHistoryAccepted:
            authorizations
              .consumptionHistoryAccepted,

        });

      renewConsent(renewedConsent);

      navigate('/registro/revision', {
        replace: true,

        state: {
          consentRenewed: true,
        },
      });
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ??
        error?.message ??
        'No pudimos actualizar el consentimiento. Intenta nuevamente.',
      );
    } finally {
      submitting.current = false;
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
    consentData,
    isLoadingConsent,
    loadError,
    retryLoadConsent,
    sensitiveFieldLabels,
    consentIsComplete,
    shouldRedirectToReview,
    handleAuthorizationChange,
    handleBack,
    handleSubmit,
  };
}
