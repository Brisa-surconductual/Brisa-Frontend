import {
  PSYCHOLOGY_TABS,
} from '@/features/users/pages/PsychologyHomePage/data/psychologyTabs.js';

import styles from './PsychologyTabBar.module.css';

export function PsychologyTabBar({
  activeTabId,
  onTabChange,
}) {
  return (
    <div className={styles.tabBar}>
      <div
        className={styles.inner}
        role="tablist"
        aria-label="Secciones del panel"
      >
        {PSYCHOLOGY_TABS.map(
          ({ id, label }) => {
            const isActive =
              id === activeTabId;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                className={
                  isActive
                    ? styles.tabActive
                    : styles.tab
                }
                aria-selected={isActive}
                aria-controls={`panel-${id}`}
                onClick={() =>
                  onTabChange(id)
                }
              >
                {label}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}