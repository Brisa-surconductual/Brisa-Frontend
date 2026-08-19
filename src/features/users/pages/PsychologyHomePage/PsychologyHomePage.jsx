import { PsychologyHeader } from '@/features/users/components/PsychologyHeader/index.js';
import { PsychologyTabBar } from '@/features/users/components/PsychologyTabBar/index.js';
import { PSYCHOLOGY_TAB } from '@/features/users/pages/PsychologyHomePage/data/psychologyTabs.js';

import { DashboardPanel } from './components/DashboardPanel.jsx';
import { PopulationPanel } from './components/PopulationPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { usePsychologyHomePage } from './hooks/usePsychologyHomePage.js';

export function PsychologyHomePage() {
  const {
    email,
    roleLabel,
    activeTabId,
    handleTabChange,
    handleLogout,
  } = usePsychologyHomePage();

  return (
    <div className="min-h-screen w-full bg-[var(--surface-bg)]">
      <div className="flex min-h-screen w-full flex-col bg-[var(--surface-bg)]">
        <PsychologyHeader
          roleLabel={roleLabel}
          onLogout={handleLogout}
        />

        <PsychologyTabBar
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
        />

        <main
          className="mx-auto w-full max-w-[1200px] flex-1 p-[var(--space-4)] md:p-[var(--space-7)] lg:px-[var(--space-7)] lg:py-[var(--space-8)]"
          role="tabpanel"
          id={`panel-${activeTabId}`}
          aria-labelledby={`tab-${activeTabId}`}
        >
          {activeTabId === PSYCHOLOGY_TAB.DASHBOARD && (
            <DashboardPanel />
          )}

          {activeTabId === PSYCHOLOGY_TAB.POBLACION && (
            <PopulationPanel />
          )}

          {activeTabId === PSYCHOLOGY_TAB.AJUSTES && (
            <SettingsPanel
              email={email}
              roleLabel={roleLabel}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}