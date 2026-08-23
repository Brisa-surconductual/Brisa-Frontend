import {
  useEffect,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { registroUsuario } from '../../../api/resgistratio.jsx';
import { useRegistration } from '../../../hooks/useRegistration.js';

import {
  normalizeBaselineForm,
} from '../../BaselinePage/utils/baselineForm.js';

import {
  getModifiedFieldLabels,
  getSensitiveModifiedFields,
} from '../../../services/registrationReview.js';

export function useReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

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
    if (!account || !baseline || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const normalizedBaseline =
        normalizeBaselineForm(baseline);

      const payload = {
        correoElectronico: account.email,
        contrasena: account.password,
        ...normalizedBaseline,
      };

      const data = await registroUsuario(payload);

      saveAccount({
        ...account,
        email:
          data?.correoElectronico ??
          account.email,
        registrationStatus:
          data?.estado_registro ??
          'REGISTRO_COMPLETO',
        accountStatus:
          data?.estado_cuenta ??
          'ACTIVA',
        role:
          data?.rol ??
          'ESTUDIANTE',
      });

      login({
        email:
          data?.correoElectronico ??
          account.email,
        role: data?.rol ?? 'ESTUDIANTE',
      });

      navigate('/registro/completado', { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        'No pudimos confirmar el registro. Intenta nuevamente.';

      setSubmitError(message);
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