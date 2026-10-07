export const subirRecursoFirmado = async ({
  uploadUrl,
  method = 'PUT',
  headers,
  file,
}) => {
  const response = await fetch(uploadUrl, {
    method,
    headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo subir el recurso. HTTP ${response.status}`,
    );
  }
};