import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import {
  getRoleLabel,
} from '@/features/users/types/authTypes.js';
import { PSYCHOLOGY_TAB } from '@/features/users/pages/PsychologyHomePage/data/psychologyTabs.js';

export function usePsychologyHomePage() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const [activeTabId, setActiveTabId] = useState(PSYCHOLOGY_TAB.DASHBOARD);

  function handleTabChange(tabId) {
    setActiveTabId(tabId);
  }

  function handleLogout() {
    logout();

    navigate('/login', { replace: true });
  }

  return {
    email: user?.email ?? '',
    roleLabel: getRoleLabel(role),
    activeTabId,
    handleTabChange,
    handleLogout,
  };
}
