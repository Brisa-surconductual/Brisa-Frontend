export function associationErrorMessage(error) {
  if (error.response?.status === 401)
    return 'Tu sesión terminó. Inicia sesión nuevamente para asociar el contenido.';
  const message = error.response?.data?.message;
  if ([400, 403, 404, 409, 422].includes(error.response?.status)) {
    if (typeof message === 'string') return message;
    if (Array.isArray(message))
      return message.filter((item) => typeof item === 'string').join(' ');
  }
  return 'No pudimos asociar el contenido a la unidad temporal. Intenta nuevamente.';
}
