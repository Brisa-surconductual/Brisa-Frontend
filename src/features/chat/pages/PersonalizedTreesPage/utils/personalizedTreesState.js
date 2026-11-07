export const initialPersonalizedTreesState = Object.freeze({
  status: 'loading', // loading | ready | error
  trees: null,
  loadError: '',
  reloadKey: 0,
  // Confirmación pendiente (publicar y archivar piden confirmar)
  confirm: null, // { action, tree }
  busy: false,
  notice: '',
  actionError: '',
});

export function personalizedTreesReducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return { ...state, status: 'ready', trees: action.trees, loadError: '' };

    case 'LOAD_ERROR':
      return { ...state, status: 'error', loadError: action.message };

    case 'RELOAD':
      return { ...state, status: 'loading', reloadKey: state.reloadKey + 1 };

    case 'CONFIRM_OPEN':
      return {
        ...state,
        confirm: { action: action.action, tree: action.tree },
        notice: '',
        actionError: '',
      };

    case 'CONFIRM_CLOSE':
      return { ...state, confirm: null };

    case 'ACTION_START':
      return { ...state, busy: true, notice: '', actionError: '' };

    case 'ACTION_OK':
      // Cierra la confirmación y vuelve a consultar los árboles.
      return {
        ...state,
        busy: false,
        confirm: null,
        notice: action.message,
        status: 'loading',
        reloadKey: state.reloadKey + 1,
      };

    case 'ACTION_ERROR':
      return {
        ...state,
        busy: false,
        confirm: null,
        actionError: action.message,
      };

    default:
      return state;
  }
}
