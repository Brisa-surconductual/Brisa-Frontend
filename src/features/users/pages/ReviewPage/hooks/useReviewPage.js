import {
  useEffect,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { confirmRegistration } from '../../../api/registrationApi.js';
import { useRegistration } from '../../../hooks/useRegistration.js';

import {
  getModifiedFieldLabels,
  getSensitiveModifiedFields,
} from '../../../services/registrationReview.js';

export function useReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    account,
    consent,
    baseline,
    modifiedFields,
    saveAccount,
    startReviewEdit,
  } = useRegistration();

  const [submitError, setSubmitError] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [consentRenewed] = useState(() =>
    Boolean(location.state?.consentRenewed),
  );

  const consentIsValid =
    consent?.status === 'VIGENTE';

  const sensitiveModifiedFields =
    getSensitiveModifiedFields(
      modifiedFields ?? [],
    );

  const sensitiveModifiedLabels =
    getModifiedFieldLabels(
      sensitiveModifiedFields,
    );

  /*
   * El mensaje se conserva en el estado local, pero se
   * elimina del historial para que no vuelva a mostrarse
   * al regresar mediante el navegador.
   */
  useEffect(() => {
    if (!location.state?.consentRenewed) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [
    location.pathname,
    location.state,
    navigate,
  ]);

  function handleBack() {
    navigate('/registro/linea-base');
  }

  function editSection(section) {
    startReviewEdit(section);
    navigate('/registro/linea-base');
  }

  function goToReconsent() {
    navigate('/registro/reconsentimiento');
  }

  async function handleConfirmation() {
    if (!consentIsValid) {
      goToReconsent();
      return;
    }

    if (!account) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const completedAccount =
        await confirmRegistration({
          userId: account.userId,
        });

      saveAccount({
        ...account,
        ...completedAccount,
      });

      navigate('/registro/completado', {
        replace: true,
      });
    } catch (error) {
      if (
        error?.code === 'CONSENT_NOT_VALID'
      ) {
        goToReconsent();
        return;
      }

      setSubmitError(
        'No pudimos confirmar el registro. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    account,
    consent,
    baseline,
    modifiedFields: modifiedFields ?? [],
    consentIsValid,
    consentRenewed,
    sensitiveModifiedLabels,
    submitError,
    isSubmitting,
    handleBack,
    editSection,
    goToReconsent,
    handleConfirmation,
  };
}