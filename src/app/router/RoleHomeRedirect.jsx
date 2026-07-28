import { Navigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { getHomePathForRole } from './roleRoutes.js';

/*
 * Punto de entrada de /app: no pinta nada, solo
 * envía a la home del rol de la sesión. Permite que
 * el login navegue a /app sin conocer las rutas.
 */
export function RoleHomeRedirect() {
  const { role } = useAuth();

  return (
    <Navigate
      to={getHomePathForRole(role)}
      replace
    />
  );
}
