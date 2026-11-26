import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import {
  getRoleLabel,
} from '@/features/users/types/authTypes.js';
import {
  REGISTRATION_STATUS_VIEW,
  getRegistrationStatusView,
} from '@/features/users/services/registrationState.js';
import {
  getDisplayName,
} from '../utils/studentUser.js';

export function useStudentHomePage() {
  const navigate = useNavigate();
  const { user, role, estadoRegistro, alcance, logout } = useAuth();

  function handleLogout() {
    logout();

    navigate('/login', { replace: true });
  }

  function goToConsent() {
    navigate('/registro/consentimiento');
  }

  const registrationStatusView = getRegistrationStatusView(
    estadoRegistro,
    alcance,
  );

  return {
    displayName: getDisplayName(user),
    roleLabel: getRoleLabel(role),
    // Estado y alcance reales de la sesión: nunca valores fijos.
    estadoRegistro,
    registrationStatusView,
    // Solo registro completo con sesión COMPLETA confirma el acceso;
    // cualquier otro estado conserva su aviso como prioridad.
    accessConfirmed:
      registrationStatusView === REGISTRATION_STATUS_VIEW.COMPLETED,
    goToConsent,
    handleLogout,
  };
}
