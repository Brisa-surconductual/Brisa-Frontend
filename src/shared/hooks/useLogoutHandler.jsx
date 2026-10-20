import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';
import { cerrarSesion } from '../../features/users/api/logout.jsx';

export function useLogoutHandler() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('Error cerrando sesión en el backend:', error);
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  }

  return handleLogout;
}