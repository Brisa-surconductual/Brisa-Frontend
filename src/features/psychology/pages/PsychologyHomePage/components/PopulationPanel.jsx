import { Info } from 'lucide-react';

import {
  FACULTY_DISTRIBUTION,
  POPULATION_AVERAGES,
} from '@/features/psychology/types/psychologyStats.js';

import {
  getSharePercentage,
  sumCounts,
} from '@/features/psychology/utils/aggregates.js';

import styles from './PopulationPanel.module.css';

export function PopulationPanel() {
  const total = sumCounts(FACULTY_DISTRIBUTION);

  return (
    <>
      <div className={styles.notice}>
        <Info size={20} strokeWidth={1.8} aria-hidden="true" />

        <div>
          <strong>Vista agregada y anónima</strong>

          <p>
            El perfil administrativo solo consulta estadísticas del grupo. El
            acceso a datos individuales identificables requiere consentimiento
            específico y llega en M08.
          </p>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Distribución por facultad</h3>

      <ul className={styles.list}>
        {FACULTY_DISTRIBUTION.map(({ id, label, count }) => (
          <li key={id} className={styles.row}>
            <span className={styles.rowLabel}>{label}</span>

            <span className={styles.rowValue}>
              {count}
              <span className={styles.rowShare}>
                {getSharePercentage(count, total)} %
              </span>
            </span>
          </li>
        ))}
      </ul>

      <h3 className={styles.sectionTitle}>Promedios del grupo</h3>

      <ul className={styles.list}>
        {POPULATION_AVERAGES.map(({ id, label, value }) => (
          <li key={id} className={styles.row}>
            <span className={styles.rowLabel}>{label}</span>

            <span className={styles.rowValue}>{value}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
