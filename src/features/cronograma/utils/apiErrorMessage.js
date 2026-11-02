/*
 * Mensaje visible para un error de API. El `message` del
 * backend puede ser string o arreglo (ValidationPipe).
 * Los errores de axios sin detalle usan el mensaje
 * alternativo: su `message` es técnico y en inglés. Los
 * errores lanzados localmente ya traen texto para el usuario.
 */
export function getApiErrorMessage(error, fallbackMessage) {
  const message = error?.response?.data?.message;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

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
