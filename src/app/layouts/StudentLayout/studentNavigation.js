import { BookOpen, Home, MessageCircle } from 'lucide-react';

const STUDENT_HOME = '/app/estudiante';
const STUDENT_CHAT = `${STUDENT_HOME}/chat`;
const STUDENT_CONTENT = `${STUDENT_HOME}/cronograma/contenido-vigente`;

export const STUDENT_SECTION = Object.freeze({
  INICIO: 'INICIO',
  CHAT: 'CHAT',
  CONTENIDO: 'CONTENIDO',
});

/*
 * Solo las rutas que existen para el estudiante. El chat (M03) es
 * el espacio principal del programa y tiene su propio destino; los
 * módulos futuros (Diario, Progreso, Mascota) se anuncian en el
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
    id: STUDENT_SECTION.CHAT,
    label: 'Chat',
    Icon: MessageCircle,
    to: STUDENT_CHAT,
  }),
  Object.freeze({
    id: STUDENT_SECTION.CONTENIDO,
    label: 'Contenido vigente',
    shortLabel: 'Contenido',
    Icon: BookOpen,
    to: STUDENT_CONTENT,
  }),
]);

const isWithin = (path, prefix) =>
  path === prefix || path.startsWith(`${prefix}/`);

// Quita las barras finales sin regex (evita backtracking sobre rutas largas).
function quitarBarrasFinales(ruta) {
  let fin = ruta.length;
  while (fin > 0 && ruta[fin - 1] === '/') fin -= 1;
  return ruta.slice(0, fin);
}

/*
 * El chat queda activo en su entrada y en sus conversaciones
 * ordinarias (`/chat/sesion/...`, sin conexión). La intervención
 * SOS (RF-43, `/app/estudiante/sos`) no es una conversación
 * terapéutica: no marca ninguna sección.
 */
export function getActiveStudentSection(pathname) {
  const path = quitarBarrasFinales(pathname);

  if (path === STUDENT_HOME) return STUDENT_SECTION.INICIO;
  if (isWithin(path, STUDENT_CHAT)) return STUDENT_SECTION.CHAT;
  if (isWithin(path, STUDENT_CONTENT)) return STUDENT_SECTION.CONTENIDO;

  return null;
}
