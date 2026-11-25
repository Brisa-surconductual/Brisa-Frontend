// Marca de orden de bytes UTF-8: permite que Excel reconozca la
// codificación (tildes y ñ); R (readr), Python (pandas) y SPSS la aceptan.
export const UTF8_BOM = '﻿';

export const CSV_MIME_TYPE = 'text/csv;charset=utf-8';

/*
 * Entrega un CSV al navegador para su descarga. Solo inicia la descarga:
 * guardar el archivo en el disco lo decide el navegador o el usuario. La
 * URL temporal se libera después del clic. `env` permite sustituir
 * `document`, `URL` y `Blob` en las pruebas.
 */
export function startCsvDownload(
  { fileName, content, blob },
  env = { document, URL, Blob },
) {
  const file =
    blob ?? new env.Blob([UTF8_BOM, content], { type: CSV_MIME_TYPE });
  const url = env.URL.createObjectURL(file);

  try {
    const link = env.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    env.document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Tras el clic, el navegador ya tomó el contenido.
    setTimeout(() => env.URL.revokeObjectURL(url), 0);
  }
}
