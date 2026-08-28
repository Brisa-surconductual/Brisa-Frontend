export const ADMINISTRATIVE_TAB = Object.freeze({
  DASHBOARD: 'DASHBOARD',
  POBLACION: 'POBLACION',
  CRONOGRAMA: 'CRONOGRAMA',
  AJUSTES: 'AJUSTES',
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
]);