import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/*
 * Aviso de cambio aplicado, recibido al volver del formulario
 * ({ cohortNotice: { action, name } } en el estado de navegación).
 * Se muestra una sola vez: el estado se limpia del historial para
 * que una recarga no anuncie cambios que ya no existen.
 */
export function useCohortSaveNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notice] = useState(() => location.state?.cohortNotice ?? null);

  useEffect(() => {
    if (location.state?.cohortNotice) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  return notice;
}
