import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { registroUsuario } from '../../../api/resgistratio.jsx';
import { sesionActual } from '../../../api/sesion.jsx';
import { useRegistration } from '../../../hooks/useRegistration.js';

import {
  REGISTRATION_OUTCOME,
  completeRegistration,
} from '../utils/completeRegistration.js';

/*
 * Sin respuesta no se sabe si la cuenta quedó creada: no se
 * reintenta automáticamente (el POST no es idempotente).
 */
const CREATION_UNCERTAIN_MESSAGE =
  'No pudimos confirmar si tu cuenta se creó. Antes de intentarlo de nuevo, intenta iniciar sesión con tu correo y contraseña.';

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

  const { login, logout, waitForSessionEnd } = useAuth();

  const submittingRef = useRef(false);

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

    // El estado no se actualiza a tiempo ante un doble clic.
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Un cierre de sesión en curso no debe tocar la cookie nueva.
      await waitForSessionEnd();

      const normalizedBaseline =
        normalizeBaselineForm(baseline);

      const payload = {
        correoElectronico: account.email,
        contrasena: account.password,
        ...normalizedBaseline,
      };

      const result = await completeRegistration({
        payload,
        createAccount: registroUsuario,
        fetchSession: sesionActual,
      });

      if (
        result.outcome ===
        REGISTRATION_OUTCOME.CREATION_REJECTED
      ) {
        const { error } = result;

        setSubmitError(
          error?.response?.data?.message ??
            error?.response?.data?.error ??
            'No pudimos confirmar el registro. Intenta nuevamente.',
        );
        return;
      }

      if (
        result.outcome ===
        REGISTRATION_OUTCOME.CREATION_UNCERTAIN
      ) {
        setSubmitError(CREATION_UNCERTAIN_MESSAGE);
        return;
      }

      const data = result.createdAccount;

      saveAccount({
        ...account,
        email:
          data?.correo_electronico ??
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

      if (
        result.outcome ===
        REGISTRATION_OUTCOME.SESSION_READY
      ) {
        const { session } = result;

        login({
          email: session.correoElectronico,
          role: session.rol,
          estadoRegistro: session.estadoRegistro,
          idUsuario: session.idUsuario,
        });
      } else {
        /*
         * La cuenta existe pero la sesión no se estableció: no se
         * presenta como autenticada. Registro completado pedirá
         * iniciar sesión con la cuenta creada.
         */
        logout();
      }

      navigate('/registro/completado', { replace: true });
    } catch {
      // Error local antes de enviar la solicitud.
      setSubmitError(
        'No pudimos confirmar el registro. Intenta nuevamente.',
      );
    } finally {
      submittingRef.current = false;
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