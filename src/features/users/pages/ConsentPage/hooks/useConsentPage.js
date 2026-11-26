import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../../hooks/useRegistration.js';
import { useAuth } from '../../../../../app/providers/index.js';
import { obtenerConsentimiento } from '../../../api/obtenerConsetimiento.jsx'; 
import { validarConsentimiento } from '../../../api/validacionConsetimeinto.jsx';
import { sesionActual } from '../../../api/sesion.jsx';
import {
  REFRESHED_SESSION_ACTION,
  classifyRefreshedSession,
} from '../../../services/registrationState.js';

const INITIAL_AUTHORIZATIONS = Object.freeze({
  personalDataAccepted: false,
  consumptionHistoryAccepted: false,
});

function focusFirstMissingAuthorization(authorizations) {
  const firstMissingField = !authorizations.personalDataAccepted
    ? 'personalDataAccepted'
    : 'consumptionHistoryAccepted';

  requestAnimationFrame(() => {
    document.getElementById(firstMissingField)?.focus();
  });
}

export function useConsentPage() {
  const navigate = useNavigate();

  const {
    account: registrationAccount,
    saveConsent,
    resetRegistration,
  } = useRegistration();

  const {
    user,
    role,
    login,
    logout,
    idUsuario,
    limiteInactividadMinutos,
  } = useAuth();
  const activeAccount = registrationAccount || (typeof user === 'string' ? { email: user } : user);

  const [authorizations, setAuthorizations] = useState({ ...INITIAL_AUTHORIZATIONS });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [consentData, setConsentData] = useState(null);
  const [isLoadingConsent, setIsLoadingConsent] = useState(true);

  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchConsentimiento() {
      try {
        const data = await obtenerConsentimiento();
        if (isMounted) {
          setConsentData(data);
          setIsLoadingConsent(false);
        }
      } catch (error) {
        // Solo el estado HTTP: el error de axios incluye la
        // cabecera CSRF de la sesión.
        console.error(
          'Error cargando el consentimiento. Estado HTTP:',
          error?.response?.status ?? 'sin respuesta',
        );
        if (isMounted) {
          setSubmitError('No pudimos cargar el documento de consentimiento actual.');
          setIsLoadingConsent(false);
        }
      }
    }

    void fetchConsentimiento();

    return () => { isMounted = false; };
  }, []);

  const consentIsComplete = authorizations.personalDataAccepted && authorizations.consumptionHistoryAccepted;

  function handleAuthorizationChange(event) {
    const { name, checked } = event.target;
    setAuthorizations((curr) => ({ ...curr, [name]: checked }));
    setSubmitError('');
  }

  function openCancelDialog() { setCancelDialogOpen(true); }

  function closeCancelDialog() {
    if (!isCancelling) setCancelDialogOpen(false);
  }
  function returnToAccountCreation() {
      if (user) {
        navigate('/login', { replace: true });
        
        setTimeout(() => {
          logout();
        }, 50); 
      } else {
        navigate('/registro/cuenta', { replace: true });
        setTimeout(() => {
          resetRegistration();
        }, 50);
      }
    }

  /*
   * Tras aceptar, el backend pasa el registro a REGISTRO_COMPLETO,
   * pero la sesión local conserva el estado del login. Se lee el
   * estado real de la sesión; si no se puede, queda desconocido
   * en lugar de mostrar el anterior. El alcance de la sesión no
   * cambia (sigue siendo el que asignó el login) y no se eleva.
   *
   * Una sesión de otra identidad o expirada no se adopta: se
   * descarta la identidad local. Una respuesta que llega con la
   * página ya cerrada (p. ej. tras cancelar) se ignora.
   */
  async function refreshRegistrationStatus() {
    let session = null;
    let error = null;

    try {
      session = await sesionActual();
    } catch (failure) {
      error = failure;
    }

    if (!mountedRef.current) return REFRESHED_SESSION_ACTION.UNKNOWN;

    const action = classifyRefreshedSession({
      session,
      error,
      expectedUserId: idUsuario,
    });

    if (action === REFRESHED_SESSION_ACTION.ACCEPT) {
      login({
        email: session.correoElectronico,
        role: session.rol,
        estadoRegistro: session.estadoRegistro,
        idUsuario: session.idUsuario,
        alcance: session.alcance,
        limiteInactividadMinutos: session.limiteInactividadMinutos,
      });
    } else if (action === REFRESHED_SESSION_ACTION.END) {
      logout();
    } else {
      login({
        email: user?.email,
        role,
        estadoRegistro: null,
        idUsuario,
        alcance: null,
        // El límite no cambia en la misma sesión: se conserva.
        limiteInactividadMinutos,
      });
    }

    return action;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAttemptedSubmit(true);

    if (!consentIsComplete) {
      focusFirstMissingAuthorization(authorizations);
      return;
    }

    if (!activeAccount || !consentData) {
      returnToAccountCreation();
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');
    setSuccessMessage('');

    try {
      if (user) {
        await validarConsentimiento({
          idUsuario: idUsuario,
          idConsentimeinto: consentData.idConsentimeinto,
        });

        await refreshRegistrationStatus();

        setSuccessMessage('Consentimiento validado correctamente.');
        setTimeout(() => {
          navigate('/app', { replace: true });
        }, 1500);
      } else {
        await saveConsent({
          personalDataAccepted: authorizations.personalDataAccepted,
          consumptionHistoryAccepted: authorizations.consumptionHistoryAccepted,
          consentVersion: consentData.versionConsetimeinto,
          idConsentimeinto: consentData.idConsentimeinto, 
          status: 'VIGENTE',
        });

        navigate('/registro/linea-base');
      }
      
    } catch (error) {
      setSubmitError('No pudimos guardar el consentimiento. Intenta de nuevo.');
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelRegistration() {
    if (!activeAccount) {
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
    account: activeAccount, 
    isFromLogin: !!user,
    consentData, 
    isLoadingConsent,
    authorizations,
    attemptedSubmit,
    submitError,
    successMessage,
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