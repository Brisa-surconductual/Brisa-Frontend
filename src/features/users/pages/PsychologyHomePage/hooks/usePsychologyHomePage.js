import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import {
  getRoleLabel,
} from '@/features/users/types/authTypes.js';

import {
  ADMINISTRATIVE_TAB,
} from '@/shared/data/administrativeTabs.js';
import { useLogoutHandler } from '@/shared/hooks/useLogoutHandler.jsx';

const LOCAL_ADMINISTRATIVE_TABS = new Set([
  ADMINISTRATIVE_TAB.DASHBOARD,
  ADMINISTRATIVE_TAB.POBLACION,
  ADMINISTRATIVE_TAB.AJUSTES,
]);

export function usePsychologyHomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const { user, role } = useAuth();

  const requestedTab =
    searchParams.get('tab');

  const activeTabId =
    LOCAL_ADMINISTRATIVE_TABS.has(
      requestedTab,
    )
      ? requestedTab
      : ADMINISTRATIVE_TAB.DASHBOARD;

  function handleTabChange(tabId) {
    if (
      tabId ===
      ADMINISTRATIVE_TAB.CRONOGRAMA
    ) {
      navigate(
        '/app/administrativo/cronograma',
      );
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.CHAT) {
      navigate('/app/administrativo/chat/modalidad');
      return;
    }

    if (
      !LOCAL_ADMINISTRATIVE_TABS.has(
        tabId,
      )
    ) {
      return;
    }

    const nextSearchParams =
      new URLSearchParams(searchParams);

    if (
      tabId ===
      ADMINISTRATIVE_TAB.DASHBOARD
    ) {
      nextSearchParams.delete('tab');
    } else {
      nextSearchParams.set(
        'tab',
        tabId,
      );
    }

    setSearchParams(nextSearchParams);
  }

  // Ajustes cierra la sesión también en el backend.
  const handleLogout = useLogoutHandler();

  return {
    email: user?.email ?? '',
    roleLabel: getRoleLabel(role),
    activeTabId,
    handleTabChange,
    handleLogout,
  };
}