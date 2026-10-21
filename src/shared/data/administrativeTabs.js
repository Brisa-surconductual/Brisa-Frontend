export const ADMINISTRATIVE_TAB = Object.freeze({
  DASHBOARD: 'DASHBOARD',
  POBLACION: 'POBLACION',
  CRONOGRAMA: 'CRONOGRAMA',
  AJUSTES: 'AJUSTES',
  CHAT: 'CHAT',
});

export const ADMINISTRATIVE_TABS = Object.freeze([
  Object.freeze({
    id: ADMINISTRATIVE_TAB.DASHBOARD,
    label: 'Dashboard',
  }),
  Object.freeze({
    id: ADMINISTRATIVE_TAB.POBLACION,
    label: 'Población',
  }),
  Object.freeze({
    id: ADMINISTRATIVE_TAB.CRONOGRAMA,
    label: 'Cronograma',
  }),
  Object.freeze({
    id: ADMINISTRATIVE_TAB.AJUSTES,
    label: 'Ajustes',
  }),
  Object.freeze({
    id: ADMINISTRATIVE_TAB.CHAT,
    label: 'Chat',
  }),
]);