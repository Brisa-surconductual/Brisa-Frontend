import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../../hooks/useRegistration.js';
import { useAuth } from '../../../../../app/providers/index.js';
import { obtenerConsentimiento } from '../../../api/obtenerConsetimiento.jsx'; 
import { validarConsentimiento } from '../../../api/validacionConsetimeinto.jsx';

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

  const { user, logout, idUsuario } = useAuth();
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
        console.error('Error fetching consent data:', error);
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

        console.log("Enviando al back:", {
          idUsuario: idUsuario,
          idConsentimeinto: consentData.idConsentimeinto,
        });

        await validarConsentimiento({
          idUsuario: idUsuario,
          idConsentimeinto: consentData.idConsentimeinto, 
        });

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