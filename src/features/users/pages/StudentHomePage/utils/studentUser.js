/*
 * Nombre visible del estudiante. Mientras el backend
 * no entregue el nombre real se usa la parte local
 * del correo, sin exponer el dominio en pantalla.
 */
export function getDisplayName(user) {
  const email = user?.email ?? '';

  const [localPart] = email.split('@');

  return localPart || 'estudiante';
}
