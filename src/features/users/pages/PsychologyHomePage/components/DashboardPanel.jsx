import { PROGRAM_STATS } from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';

import styles from './DashboardPanel.module.css';

export function DashboardPanel() {
  return (
    <>
      <ul className={styles.grid}>
        {PROGRAM_STATS.map(({ id, value, label, tone }) => (
          <li key={id} className={styles.card}>
            <p className={`${styles.value} ${styles[tone]}`}>{value}</p>

            <p className={styles.label}>{label}</p>
          </li>
        ))}
      </ul>

      <p className={styles.note}>
        Cifras de ejemplo, agregadas y anónimas. Los módulos de reportes y
        métricas estarán disponibles en M04 y M08.
      </p>
    </>
  );
}
