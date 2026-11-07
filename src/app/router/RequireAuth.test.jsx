import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Navigate, Outlet } from 'react-router-dom';

import { USER_ROLE } from '@/features/users/types/authTypes.js';

import { RequireAuth } from './RequireAuth.jsx';

let authState;

vi.mock('@/app/providers/index.js', () => ({
  useAuth: () => authState,
}));

const ADMIN_ONLY = Object.freeze([USER_ROLE.ADMINISTRATIVO]);

/*
 * RequireAuth solo lee el contexto: se invoca directamente y se
 * inspecciona el elemento que devuelve (Navigate u Outlet).
 */
function decide(allowedRoles) {
  return RequireAuth({ allowedRoles });
}

describe('Guarda de acceso por rol', () => {
  beforeEach(() => {
    authState = { isLoading: false, isAuthenticated: false, role: null };
  });

  it('sin sesión redirige al login', () => {
    const element = decide(ADMIN_ONLY);

    expect(element.type).toBe(Navigate);
    expect(element.props).toMatchObject({ to: '/login', replace: true });
  });

  it('un estudiante que entra a una ruta administrativa vuelve a su inicio', () => {
    authState = {
      isLoading: false,
      isAuthenticated: true,
      role: USER_ROLE.ESTUDIANTE,
    };

    const element = decide(ADMIN_ONLY);

    expect(element.type).toBe(Navigate);
    expect(element.props.to).toBe('/app/estudiante');
  });

  it('un administrativo accede a la ruta administrativa', () => {
    authState = {
      isLoading: false,
      isAuthenticated: true,
      role: USER_ROLE.ADMINISTRATIVO,
    };

    expect(decide(ADMIN_ONLY).type).toBe(Outlet);
  });

  it('mientras se verifica la sesión al recargar no muestra la página', () => {
    authState = { isLoading: true, isAuthenticated: false, role: null };

    expect(decide(ADMIN_ONLY)).toBeNull();
  });

  it('sin roles exigidos basta con la sesión', () => {
    authState = {
      isLoading: false,
      isAuthenticated: true,
      role: USER_ROLE.ESTUDIANTE,
    };

    expect(decide(undefined).type).toBe(Outlet);
  });
});
