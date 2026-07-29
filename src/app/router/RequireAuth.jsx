import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { getHomePathForRole, LOGIN_PATH } from './roleRoutes.js';

/*
 * Guarda de ruta. Sin `allowedRoles` la ruta solo
 * exige sesión; con él, además restringe por rol.
 */
export function RequireAuth({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={LOGIN_PATH}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    /*
     * Rol sin permiso sobre esta ruta: se le lleva a
     * su propia home, no se le deja en un callejón.
     */
    return (
      <Navigate
        to={getHomePathForRole(role)}
        replace
      />
    );
  }

  return <Outlet />;
}
