import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { getRoleLabel } from '@/features/student/types/studentRoles.js';
import { getDisplayName } from '@/features/student/utils/studentUser.js';

export function useStudentHomePage() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  function handleLogout() {
    logout();

    navigate('/login', { replace: true });
  }

  return {
    displayName: getDisplayName(user),
    roleLabel: getRoleLabel(role),
    handleLogout,
  };
}
