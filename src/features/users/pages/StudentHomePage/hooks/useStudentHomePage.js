import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import {
  getRoleLabel,
} from '@/features/users/types/authTypes.js';
import {
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

  return {
    displayName: getDisplayName(user),
    roleLabel: getRoleLabel(role),
    // Estado y alcance reales de la sesión: nunca valores fijos.
    estadoRegistro,
    registrationStatusView: getRegistrationStatusView(
      estadoRegistro,
      alcance,
    ),
    goToConsent,
    handleLogout,
  };
}
