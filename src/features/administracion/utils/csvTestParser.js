/*
 * SOLO PARA PRUEBAS (no lo importa ningún módulo de la aplicación).
 * Lector RFC 4180 mínimo: comprueba que el CSV
 * generado se interpreta de vuelta con los mismos valores, como lo haría
 * una herramienta habitual (Excel, R, pandas).
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r' && text[i + 1] === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
    } else {
      field += char;
    }
  }

  return rows;
}
