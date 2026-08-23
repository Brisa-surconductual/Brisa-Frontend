import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { getHomePathForRole, LOGIN_PATH } from './roleRoutes.js';

export function RequireAuth({ allowedRoles }) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    // Aún verificando si hay sesión válida (cookie).
    // Evita redirigir de más mientras se resuelve.
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return <Outlet />;
}