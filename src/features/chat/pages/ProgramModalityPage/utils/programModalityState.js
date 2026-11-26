export const initialProgramModalityState = Object.freeze({
  status: 'loading', // loading | ready | error
  eligibility: null,
  loadError: '',
  reloadKey: 0,
});

export function programModalityReducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        status: 'ready',
        eligibility: action.eligibility,
        loadError: '',
      };

    case 'LOAD_ERROR':
      return {
        ...state,
        status: 'error',
        eligibility: null,
        loadError: action.message,
      };

    case 'RELOAD':
      return { ...state, status: 'loading', reloadKey: state.reloadKey + 1 };

    default:
      return state;
  }
}
