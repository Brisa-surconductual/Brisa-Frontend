import { BookOpen, Home } from 'lucide-react';

const STUDENT_HOME = '/app/estudiante';

export const STUDENT_SECTION = Object.freeze({
  INICIO: 'INICIO',
  CONTENIDO: 'CONTENIDO',
});

/*
 * Solo las rutas que existen para el estudiante. Los módulos
 * futuros (Chat, Diario, Progreso, Perfil) se anuncian en el
 * inicio como "próximamente", no en la navegación.
 */
export const STUDENT_NAV_ITEMS = Object.freeze([
  Object.freeze({
    id: STUDENT_SECTION.INICIO,
    label: 'Inicio',
    Icon: Home,
    to: STUDENT_HOME,
  }),
  Object.freeze({
    id: STUDENT_SECTION.CONTENIDO,
    label: 'Contenido vigente',
    shortLabel: 'Contenido',
    Icon: BookOpen,
    to: `${STUDENT_HOME}/cronograma/contenido-vigente`,
  }),
]);

export function getActiveStudentSection(pathname) {
  const path = pathname.replace(/\/+$/, '');

  if (path === STUDENT_HOME) return STUDENT_SECTION.INICIO;

  if (path.startsWith(`${STUDENT_HOME}/cronograma/contenido-vigente`)) {
    return STUDENT_SECTION.CONTENIDO;
  }

  return null;
}
