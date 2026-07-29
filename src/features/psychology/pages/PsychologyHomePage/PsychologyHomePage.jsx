import { PsychologyHeader } from '@/features/psychology/components/PsychologyHeader/index.js';
import { PsychologyTabBar } from '@/features/psychology/components/PsychologyTabBar/index.js';
import { PSYCHOLOGY_TAB } from '@/features/psychology/types/psychologyTabs.js';

import { DashboardPanel } from './components/DashboardPanel.jsx';
import { PopulationPanel } from './components/PopulationPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { usePsychologyHomePage } from './hooks/usePsychologyHomePage.js';

import styles from './PsychologyHomePage.module.css';

export function PsychologyHomePage() {
  const { email, roleLabel, activeTabId, handleTabChange, handleLogout } =
    usePsychologyHomePage();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PsychologyHeader roleLabel={roleLabel} onLogout={handleLogout} />

        <PsychologyTabBar
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
        />

        <main
          className={styles.content}
          role="tabpanel"
          id={`panel-${activeTabId}`}
          aria-labelledby={`tab-${activeTabId}`}
        >
          {activeTabId === PSYCHOLOGY_TAB.DASHBOARD && <DashboardPanel />}

          {activeTabId === PSYCHOLOGY_TAB.POBLACION && <PopulationPanel />}

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
