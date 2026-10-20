export function currentContentError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.message;
  if (
    status === 422 &&
    typeof message === 'string' &&
    (message.includes('unidades temporales') ||
      message.includes('contenido programado'))
  ) {
    return 'Tu cronograma está asignado, pero su planificación aún no está completa. El equipo administrador debe configurar las unidades y los contenidos antes de activarlo. Vuelve a consultar cuando esté listo.';
  }
  if (status === 401)
    return 'Tu sesión terminó. Inicia sesión nuevamente para consultar tu contenido.';
  return 'No pudimos consultar tu contenido vigente. Intenta nuevamente.';
}
