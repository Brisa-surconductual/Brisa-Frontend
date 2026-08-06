import {
  Home,
  MessageCircle,
  NotebookPen,
  TrendingUp,
  User,
} from 'lucide-react';

import styles from './StudentBottomNav.module.css';

/*
 * Shell de navegación: solo Inicio existe hoy. El
 * resto queda deshabilitado hasta que se construyan
 * sus módulos, no oculto, para que el estudiante vea
 * el alcance del programa.
 */
const NAV_ITEMS = Object.freeze([
  Object.freeze({ id: 'inicio', label: 'Inicio', Icon: Home }),
  Object.freeze({ id: 'chat', label: 'Chat', Icon: MessageCircle }),
  Object.freeze({ id: 'diario', label: 'Diario', Icon: NotebookPen }),
  Object.freeze({ id: 'progreso', label: 'Progreso', Icon: TrendingUp }),
  Object.freeze({ id: 'perfil', label: 'Perfil', Icon: User }),
]);

export function StudentBottomNav({ activeItemId = 'inicio' }) {
  return (
    <nav className={styles.nav} aria-label="Secciones del programa">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = id === activeItemId;

        return (
          <button
            key={id}
            type="button"
            className={isActive ? styles.itemActive : styles.item}
            disabled={!isActive}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />

            <span className={styles.label}>{label}</span>

            {!isActive && <span className={styles.srOnly}>Próximamente</span>}
          </button>
        );
      })}
    </nav>
  );
}
