/*
 * Texto visible para un error de la API en el registro.
 *
 * - El `message` del backend se muestra tal cual (string o arreglo de
 *   ValidationPipe, unido en una frase).
 * - `data.error` no se usa: en NestJS es el nombre del estado HTTP en
 *   inglés («Bad Request»), no un mensaje para la persona usuaria.
 * - El `message` de un error de axios («Network Error», «Request failed
 *   with status code 500») es técnico y en inglés: se usa el respaldo.
 * - Un error lanzado localmente ya trae texto para el usuario.
 */
export function getApiErrorText(error, fallbackMessage) {
  const message = error?.response?.data?.message;

  if (typeof message === 'string' && message.trim()) return message;

  if (Array.isArray(message)) {
    const details = message.filter(
      (item) => typeof item === 'string' && item.trim(),
    );

    if (details.length > 0) return details.join(', ');
  }

  if (
    !error?.isAxiosError &&
    !error?.response &&
    typeof error?.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallbackMessage;
}
