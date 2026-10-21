import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';
import { ADMINISTRATIVE_TAB } from '@/shared/data/administrativeTabs.js';

export function useProgramModalityPage({ eligibility, onEnableModality }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleTabChange(tabId) {
    if (tabId === ADMINISTRATIVE_TAB.CHAT) {
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.CRONOGRAMA) {
      navigate('/app/administrativo/cronograma');
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.DASHBOARD) {
      navigate('/app/administrativo');
      return;
    }

    if (
      tabId === ADMINISTRATIVE_TAB.POBLACION ||
      tabId === ADMINISTRATIVE_TAB.AJUSTES
    ) {
      navigate(`/app/administrativo?tab=${encodeURIComponent(tabId)}`);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const canEnable =
    eligibility?.elegible === true && typeof onEnableModality === 'function';

  function handleOpenConfirmation() {
    if (!canEnable || isProcessing) return;

    setFeedback(null);
    setIsConfirmationOpen(true);
  }

  function handleCancelConfirmation() {
    if (isProcessing) return;

    setIsConfirmationOpen(false);
  }

  async function handleConfirmModality() {
    if (!canEnable || isProcessing) return;

    setIsProcessing(true);
    setFeedback(null);

    try {
      await onEnableModality(eligibility.id_programa);

      setFeedback({
        type: 'success',
        message: 'La modalidad personalizada se habilitó correctamente.',
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'No fue posible completar el cambio de modalidad.',
      });
    } finally {
      setIsProcessing(false);
      setIsConfirmationOpen(false);
    }
  }

  return {
    isConfirmationOpen,
    isProcessing,
    feedback,
    handleOpenConfirmation,
    handleCancelConfirmation,
    handleConfirmModality,
    handleTabChange,
    handleLogout,
  };
}
