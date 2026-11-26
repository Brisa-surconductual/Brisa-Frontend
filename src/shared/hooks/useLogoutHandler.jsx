import { useNavigate } from 'react-router-dom';
import { SESSION_END_REASON } from '@/app/config/sessionConfig.js';
import { useAuth } from '@/app/providers/index.js';

/*
 * Cierre de sesión iniciado por el usuario. `endSession`
 * invalida la sesión en el backend antes de limpiar el
 * estado local y nunca lanza: si el backend no lo confirma,
 * el login lo informa.
 */
export function useLogoutHandler() {
  const navigate = useNavigate();
  const { endSession } = useAuth();

  async function handleLogout() {
    await endSession({ reason: SESSION_END_REASON.MANUAL });
    navigate('/login', { replace: true });
  }

  return handleLogout;
}
