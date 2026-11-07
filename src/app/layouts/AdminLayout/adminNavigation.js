import {
  CalendarRange,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Users,
} from 'lucide-react';

import { ADMINISTRATIVE_TAB } from '@/shared/data/administrativeTabs.js';

const ADMIN_HOME = '/app/administrativo';

export const ADMIN_SECTION = Object.freeze({
  DASHBOARD: ADMINISTRATIVE_TAB.DASHBOARD,
  POBLACION: ADMINISTRATIVE_TAB.POBLACION,
  CRONOGRAMA: ADMINISTRATIVE_TAB.CRONOGRAMA,
  CHAT: ADMINISTRATIVE_TAB.CHAT,
  AJUSTES: ADMINISTRATIVE_TAB.AJUSTES,
});

/*
 * Navegación administrativa. Solo destinos existentes:
 * Población y Ajustes son pestañas del panel principal
 * (?tab=), igual que antes; Chat abre su sección Modalidad.
 */
export const ADMIN_NAV_ITEMS = Object.freeze([
  Object.freeze({
    id: ADMIN_SECTION.DASHBOARD,
    label: 'Dashboard',
    Icon: LayoutDashboard,
    to: Object.freeze({ pathname: ADMIN_HOME }),
  }),
  Object.freeze({
    id: ADMIN_SECTION.POBLACION,
    label: 'Población',
    Icon: Users,
    to: Object.freeze({
      pathname: ADMIN_HOME,
      search: `?tab=${ADMIN_SECTION.POBLACION}`,
    }),
  }),
  Object.freeze({
    id: ADMIN_SECTION.CRONOGRAMA,
    label: 'Cronogramas',
    Icon: CalendarRange,
    to: Object.freeze({ pathname: `${ADMIN_HOME}/cronograma` }),
  }),
  Object.freeze({
    id: ADMIN_SECTION.CHAT,
    label: 'Chat',
    Icon: MessagesSquare,
    to: Object.freeze({ pathname: `${ADMIN_HOME}/chat/modalidad` }),
  }),
  Object.freeze({
    id: ADMIN_SECTION.AJUSTES,
    label: 'Ajustes',
    Icon: Settings,
    to: Object.freeze({
      pathname: ADMIN_HOME,
      search: `?tab=${ADMIN_SECTION.AJUSTES}`,
    }),
  }),
]);

const HOME_TABS = Object.freeze([
  ADMIN_SECTION.POBLACION,
  ADMIN_SECTION.AJUSTES,
]);

/*
 * Sección activa según la URL. Todas las páginas internas de
 * cronogramas y de chat cuentan como su sección. En el panel
 * principal manda ?tab= con la misma regla que el panel: un
 * valor desconocido equivale al Dashboard.
 */
export function getActiveAdminSection(pathname, search = '') {
  const path = pathname.replace(/\/+$/, '');

  if (path.startsWith(`${ADMIN_HOME}/cronograma`)) {
    return ADMIN_SECTION.CRONOGRAMA;
  }

  if (path.startsWith(`${ADMIN_HOME}/chat`)) {
    return ADMIN_SECTION.CHAT;
  }

  if (path === ADMIN_HOME) {
    const tab = new URLSearchParams(search).get('tab');

    return HOME_TABS.includes(tab) ? tab : ADMIN_SECTION.DASHBOARD;
  }

  return null;
}

export function getAdminSectionLabel(sectionId) {
  return ADMIN_NAV_ITEMS.find(({ id }) => id === sectionId)?.label ?? '';
}
