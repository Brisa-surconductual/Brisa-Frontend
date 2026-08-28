import {
  AdministrativeHeader,
} from '@/shared/components/navigation/AdministrativeHeader/index.js';

import {
  AdministrativeTabBar,
} from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

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
        <AdministrativeHeader
          roleLabel={roleLabel}
          onLogout={handleLogout}
        />

        <AdministrativeTabBar
          tabs={ADMINISTRATIVE_TABS}
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
        />

        <main
          className="mx-auto w-full max-w-[1200px] flex-1 p-[var(--space-4)] md:p-[var(--space-7)] lg:px-[var(--space-7)] lg:py-[var(--space-8)]"
          role="tabpanel"
          id={`panel-${activeTabId}`}
          aria-labelledby={`tab-${activeTabId}`}
        >
          {activeTabId === ADMINISTRATIVE_TAB.DASHBOARD && (
            <DashboardPanel />
          )}

          {activeTabId === ADMINISTRATIVE_TAB.POBLACION && (
            <PopulationPanel />
          )}

          {activeTabId === ADMINISTRATIVE_TAB.AJUSTES && (
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