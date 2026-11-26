import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import { isReadOnlyRejection } from '../services/readOnlyRestriction.js';

export function observeReadOnlyRejections(onRejection) {
  let active = true;
  const interceptor = apiClient.interceptors.response.use(undefined, (error) => {
    if (active) {
      const apiError = toApiError(error);
      if (isReadOnlyRejection(apiError)) onRejection(apiError.mensaje);
    }
    throw error;
  });

  return () => {
    active = false;
    apiClient.interceptors.response.eject(interceptor);
  };
}
