import { describe, expect, it } from 'vitest';

import {
  getRoleLabel,
  USER_ROLE,
} from '@/features/users/types/authTypes.js';

import { getHomePathForRole, LOGIN_PATH } from './roleRoutes.js';

describe('getHomePathForRole', () => {
  it.each([
    [USER_ROLE.ESTUDIANTE, '/app/estudiante'],
    [USER_ROLE.ADMINISTRATIVO, '/app/administrativo'],
    [USER_ROLE.COORDINADOR_PSI, '/app/administrativo'],
  ])('%s va a %s', (role, path) => {
    expect(getHomePathForRole(role)).toBe(path);
  });

  it.each([['OTRO'], [null], [undefined]])(
    'un rol desconocido (%s) va al login',
    (role) => {
      expect(getHomePathForRole(role)).toBe(LOGIN_PATH);
    },
  );
});

describe('getRoleLabel', () => {
  it('el coordinador tiene etiqueta y un rol desconocido, vacía', () => {
    expect(getRoleLabel(USER_ROLE.COORDINADOR_PSI)).toBe(
      'Coordinación de psicología',
    );
    expect(getRoleLabel('OTRO')).toBe('');
  });
});
