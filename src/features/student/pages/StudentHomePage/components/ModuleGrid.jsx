import { MessageCircle, NotebookPen, PawPrint, TrendingUp } from 'lucide-react';

import {
  STUDENT_MODULE,
  STUDENT_MODULES,
} from '@/features/student/types/studentModules.js';

import styles from './ModuleGrid.module.css';

const MODULE_ICON = Object.freeze({
  [STUDENT_MODULE.CHAT]: MessageCircle,
  [STUDENT_MODULE.DIARIO]: NotebookPen,
  [STUDENT_MODULE.PROGRESO]: TrendingUp,
  [STUDENT_MODULE.MASCOTA]: PawPrint,
});

export function ModuleGrid() {
  return (
    <ul className={styles.grid}>
      {STUDENT_MODULES.map(({ id, name, description, release }) => {
        const Icon = MODULE_ICON[id];

        return (
          <li key={id} className={styles.card}>
            <Icon
              className={styles.icon}
              size={22}
              strokeWidth={1.6}
              aria-hidden="true"
            />

            <h3 className={styles.name}>{name}</h3>

            <p className={styles.description}>{description}</p>

            <p className={styles.release}>{release} · próximamente</p>
          </li>
        );
      })}
    </ul>
  );
}
