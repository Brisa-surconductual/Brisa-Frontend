import { CircleCheck } from 'lucide-react';

import { StudentBottomNav } from '@/features/users/components/StudentBottomNav/index.js';
import { StudentHeader } from '@/features/users/components/StudentHeader/index.js';

import { ModuleGrid } from './components/ModuleGrid.jsx';
import { useStudentHomePage } from './hooks/useStudentHomePage.js';

import styles from './StudentHomePage.module.css';

export function StudentHomePage() {
  const { displayName, roleLabel, handleLogout } = useStudentHomePage();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <StudentHeader
          displayName={displayName}
          roleLabel={roleLabel}
          onLogout={handleLogout}
        />

        <main className={styles.content}>
          <div className={styles.notice}>
            <CircleCheck size={20} strokeWidth={1.8} aria-hidden="true" />

            <div>
              <strong>¡Registro completado!</strong>

              <p>
                Tu programa psicoeducativo está listo. Los módulos se
                habilitarán según tu progreso.
              </p>
            </div>
          </div>

          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Estado de tu cuenta</span>

            {/*
             * Valor fijo por ahora: la sesión solo lleva
             * correo y rol. Debe leerse de `estado_registro`
             * cuando este viaje en la sesión.
             */}
            <span className={styles.statusBadge}>
              <span className={styles.statusDot} aria-hidden="true" />
              REGISTRO_COMPLETO
            </span>
          </div>

          <h2 className={styles.sectionTitle}>Módulos del programa</h2>

          <ModuleGrid />
        </main>

        <StudentBottomNav activeItemId="inicio" />
      </div>
    </div>
  );
}
